"""
Narrative Identity Builder - Extract and understand life narrative

Implements narrative psychology principles:
- Life story extraction: Key events that define identity
- Turning points: Pivotal moments of transformation
- Meaning-making: How user interprets experiences
- Identity themes: Recurring patterns in self-concept
- Coherence: Integration of past, present, future self
"""

import json
import re
from typing import Dict, List, Optional, Set
from datetime import datetime
from collections import defaultdict, Counter

from .config import settings
from .db_utils import db


class NarrativeIdentityBuilder:
    """Build user's narrative identity from life stories"""
    
    # Event categories
    EVENT_CATEGORIES = {
        'education': ['school', 'college', 'university', 'degree', 'graduated', 'studied'],
        'career': ['job', 'career', 'work', 'promoted', 'hired', 'started working'],
        'relationship': ['met', 'married', 'divorced', 'broke up', 'fell in love', 'relationship'],
        'loss': ['died', 'passed away', 'lost', 'death', 'ended', 'grief'],
        'achievement': ['achieved', 'accomplished', 'won', 'succeeded', 'earned', 'completed'],
        'travel': ['traveled', 'moved to', 'visited', 'trip', 'journey'],
        'health': ['illness', 'recovered', 'diagnosis', 'surgery', 'health crisis'],
        'personal_growth': ['learned', 'realized', 'discovered', 'changed', 'transformed'],
        'family': ['born', 'had a child', 'became parent', 'sibling', 'family'],
        'hardship': ['struggled', 'difficult time', 'challenge', 'obstacle', 'hardship'],
    }
    
    # Turning point indicators
    TURNING_POINT_MARKERS = [
        'changed my life',
        'turning point',
        'pivotal moment',
        'everything changed',
        'never the same',
        'transformed',
        'realized',
        'wake-up call',
        'defining moment'
    ]
    
    # Meaning-making patterns
    MEANING_PATTERNS = [
        r'(?:that|this)\s+(?:taught|showed|made)\s+me\s+(?:that\s+)?(.+?)(\.|\,|$)',
        r'I\s+learned\s+(?:that\s+)?(.+?)(\.|\,|$)',
        r'(?:what|which)\s+means\s+(?:that\s+)?(.+?)(\.|\,|$)',
        r'the\s+significance\s+(?:is|was)\s+(.+?)(\.|\,|$)',
        r'(?:looking\s+back|in\s+retrospect),\s+(.+?)(\.|\,|$)',
    ]
    
    # Identity themes keywords
    THEME_KEYWORDS = {
        'resilience': ['overcame', 'survived', 'persisted', 'bounced back', 'resilient'],
        'ambition': ['ambitious', 'driven', 'goal', 'achieve', 'success', 'strive'],
        'compassion': ['care', 'help', 'empathy', 'compassion', 'support', 'kindness'],
        'curiosity': ['curious', 'explore', 'learn', 'discover', 'wonder', 'question'],
        'independence': ['independent', 'own way', 'self-reliant', 'autonomous'],
        'perfectionism': ['perfect', 'flawless', 'high standards', 'meticulous'],
        'creativity': ['creative', 'imagine', 'innovate', 'artistic', 'original'],
        'loyalty': ['loyal', 'committed', 'devoted', 'faithful', 'dedicated'],
        'optimism': ['optimistic', 'positive', 'hopeful', 'silver lining'],
        'authenticity': ['authentic', 'true to myself', 'genuine', 'real'],
        'growth_oriented': ['grow', 'develop', 'improve', 'evolve', 'progress'],
        'family_oriented': ['family first', 'family values', 'family important'],
    }
    
    # Temporal indicators
    TIME_PATTERNS = [
        r'(?:in|during)\s+(\d{4})',  # Year
        r'when\s+I\s+was\s+(\d+)',    # Age
        r'(childhood|adolescence|teen|twenties|thirties)',  # Life stage
        r'(years?\s+ago|months?\s+ago)',
        r'(early|mid|late)\s+(career|life|twenties)',
    ]
    
    def __init__(self):
        self.user_narratives = {}
    
    def extract_narrative_identity(
        self,
        user_id: str,
        conversations: List[Dict] = None,
        save_to_db: bool = True
    ) -> Dict[str, any]:
        """
        Extract complete narrative identity
        
        Returns:
            - life_events: Chronological life events
            - turning_points: Pivotal moments
            - themes: Identity themes
            - coherence_score: How integrated the narrative is
        """
        if conversations is None:
            conversations = db.get_user_conversations(user_id, limit=500)
        
        user_messages = [c for c in conversations if c['role'] == 'user']
        
        # Step 1: Extract life events
        events = self._extract_life_events(user_messages)
        
        # Step 2: Identify turning points
        turning_points = self._identify_turning_points(events)
        
        # Step 3: Extract meaning-making
        meanings = self._extract_meanings(user_messages)
        
        # Step 4: Identify identity themes
        themes = self._identify_identity_themes(user_messages, events)
        
        # Step 5: Assess narrative coherence
        coherence = self._assess_narrative_coherence(events, themes)
        
        narrative = {
            'life_events': events,
            'turning_points': turning_points,
            'meanings': meanings,
            'themes': themes,
            'coherence_score': coherence,
            'total_events': len(events)
        }
        
        if save_to_db:
            self._save_narrative_identity(user_id, narrative)
        
        return narrative
    
    def _extract_life_events(self, messages: List[Dict]) -> List[Dict]:
        """Extract significant life events from conversations"""
        events = []
        
        for msg in messages:
            content = msg['content']
            
            # Look for past tense narratives (storytelling)
            if self._is_narrative_content(content):
                # Extract temporal information
                event_date = self._extract_temporal_info(content)
                
                # Categorize event
                category = self._categorize_event(content)
                
                # Check if turning point
                is_turning_point = any(
                    marker in content.lower() 
                    for marker in self.TURNING_POINT_MARKERS
                )
                
                # Extract emotional valence
                valence = self._estimate_emotional_valence(content)
                
                events.append({
                    'description': content[:300],  # First 300 chars
                    'date': event_date,
                    'category': category,
                    'is_turning_point': is_turning_point,
                    'emotional_valence': valence,
                    'conversation_id': msg.get('conversation_id'),
                    'timestamp': msg.get('timestamp')
                })
        
        return events
    
    def _is_narrative_content(self, text: str) -> bool:
        """Detect if content is narrative/story-telling"""
        # Indicators of narrative content
        narrative_markers = [
            'when I',
            'I remember',
            'back when',
            'there was a time',
            'once',
            'I used to',
            'growing up',
            'in my',
        ]
        
        text_lower = text.lower()
        
        # Count past tense verbs (simplified)
        past_tense = ['was', 'were', 'had', 'did', 'went', 'came', 'made', 'took']
        past_count = sum(1 for word in past_tense if word in text_lower)
        
        # Count narrative markers
        marker_count = sum(1 for marker in narrative_markers if marker in text_lower)
        
        # Narrative if multiple indicators
        return (past_count >= 2 or marker_count >= 1) and len(text.split()) > 20
    
    def _extract_temporal_info(self, text: str) -> Optional[str]:
        """Extract temporal information from text"""
        for pattern in self.TIME_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return None
    
    def _categorize_event(self, text: str) -> str:
        """Categorize event based on content"""
        text_lower = text.lower()
        
        category_scores = {}
        for category, keywords in self.EVENT_CATEGORIES.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                category_scores[category] = score
        
        if not category_scores:
            return 'general'
        
        return max(category_scores.items(), key=lambda x: x[1])[0]
    
    def _estimate_emotional_valence(self, text: str) -> float:
        """Estimate emotional valence (-1 to 1)"""
        text_lower = text.lower()
        
        positive_words = [
            'happy', 'joy', 'love', 'success', 'wonderful', 'great',
            'amazing', 'accomplished', 'proud', 'excited', 'grateful'
        ]
        
        negative_words = [
            'sad', 'difficult', 'hard', 'struggle', 'pain', 'loss',
            'failed', 'disappointed', 'hurt', 'terrible', 'awful'
        ]
        
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count + neg_count == 0:
            return 0.0
        
        return (pos_count - neg_count) / (pos_count + neg_count)
    
    def _identify_turning_points(self, events: List[Dict]) -> List[Dict]:
        """Identify turning points from events"""
        return [e for e in events if e['is_turning_point']]
    
    def _extract_meanings(self, messages: List[Dict]) -> List[Dict]:
        """Extract meaning-making statements"""
        meanings = []
        
        for msg in messages:
            content = msg['content']
            
            for pattern in self.MEANING_PATTERNS:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    meaning_text = match.group(1).strip()
                    
                    if len(meaning_text) > 10:
                        meanings.append({
                            'meaning': meaning_text,
                            'context': match.group(0),
                            'conversation_id': msg.get('conversation_id'),
                            'timestamp': msg.get('timestamp')
                        })
        
        return meanings
    
    def _identify_identity_themes(
        self,
        messages: List[Dict],
        events: List[Dict]
    ) -> List[Dict]:
        """Identify recurring identity themes"""
        theme_counts = defaultdict(list)
        
        # Analyze all user messages
        all_text = ' '.join([m['content'].lower() for m in messages])
        
        for theme, keywords in self.THEME_KEYWORDS.items():
            for keyword in keywords:
                if keyword in all_text:
                    # Find specific instances
                    for msg in messages:
                        if keyword in msg['content'].lower():
                            theme_counts[theme].append({
                                'keyword': keyword,
                                'context': msg['content'][:150],
                                'conversation_id': msg.get('conversation_id')
                            })
        
        # Build theme profiles
        themes = []
        for theme_name, instances in theme_counts.items():
            if len(instances) >= 2:  # At least 2 mentions
                strength = min(len(instances) / 10.0, 0.95)
                
                themes.append({
                    'theme': theme_name,
                    'strength': strength,
                    'occurrence_count': len(instances),
                    'examples': instances[:3]  # Top 3 examples
                })
        
        # Sort by strength
        themes.sort(key=lambda x: x['strength'], reverse=True)
        
        return themes
    
    def _assess_narrative_coherence(
        self,
        events: List[Dict],
        themes: List[Dict]
    ) -> float:
        """Assess how coherent/integrated the narrative is"""
        if not events:
            return 0.0
        
        coherence_score = 0.5
        
        # Factor 1: Temporal organization (events have dates)
        dated_events = [e for e in events if e.get('date')]
        if len(events) > 0:
            temporal_coherence = len(dated_events) / len(events)
            coherence_score += temporal_coherence * 0.2
        
        # Factor 2: Categorical diversity (multiple life domains)
        categories = set(e['category'] for e in events)
        if len(categories) >= 3:
            coherence_score += 0.1
        
        # Factor 3: Theme consistency (strong recurring themes)
        if themes:
            avg_theme_strength = sum(t['strength'] for t in themes) / len(themes)
            coherence_score += avg_theme_strength * 0.2
        
        # Factor 4: Presence of turning points
        turning_points = [e for e in events if e['is_turning_point']]
        if turning_points:
            coherence_score += min(len(turning_points) / 5.0, 0.1)
        
        return min(coherence_score, 1.0)
    
    def _save_narrative_identity(self, user_id: str, narrative: Dict):
        """Save narrative identity to database"""
        # Save events
        for event in narrative['life_events']:
            query = """
                INSERT INTO narrative_identity
                (user_id, event_description, event_date, event_category,
                 is_turning_point, emotional_valence, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            
            db.execute_update(
                query,
                (
                    user_id,
                    event['description'],
                    event.get('date'),
                    event['category'],
                    event['is_turning_point'],
                    event['emotional_valence'],
                    event.get('timestamp', datetime.now().isoformat())
                )
            )
        
        # Save themes
        for theme in narrative['themes']:
            query = """
                INSERT INTO identity_themes
                (user_id, theme_name, description, strength,
                 supporting_events, first_detected, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, theme_name)
                DO UPDATE SET
                    strength = ?,
                    supporting_events = ?,
                    last_updated = ?
            """
            
            now = datetime.now().isoformat()
            examples_json = json.dumps(theme['examples'])
            
            db.execute_update(
                query,
                (
                    user_id,
                    theme['theme'],
                    f"Occurred {theme['occurrence_count']} times",
                    theme['strength'],
                    examples_json,
                    now,
                    now,
                    # For UPDATE
                    theme['strength'],
                    examples_json,
                    now
                )
            )
    
    def get_narrative_identity(self, user_id: str) -> Dict[str, any]:
        """Get user's narrative identity from database"""
        # Get events
        events_query = """
            SELECT *
            FROM narrative_identity
            WHERE user_id = ?
            ORDER BY 
                CASE 
                    WHEN event_date IS NOT NULL THEN 0 
                    ELSE 1 
                END,
                event_date DESC,
                created_at DESC
        """
        
        events = db.execute_query(events_query, (user_id,))
        
        # Get themes
        themes_query = """
            SELECT *
            FROM identity_themes
            WHERE user_id = ?
            ORDER BY strength DESC
        """
        
        themes = db.execute_query(themes_query, (user_id,))
        
        for theme in themes:
            if theme.get('supporting_events'):
                theme['supporting_events'] = json.loads(theme['supporting_events'])
        
        # Get statistics
        stats_query = """
            SELECT 
                event_category,
                COUNT(*) as count,
                AVG(emotional_valence) as avg_valence
            FROM narrative_identity
            WHERE user_id = ?
            GROUP BY event_category
        """
        
        stats = db.execute_query(stats_query, (user_id,))
        
        return {
            'events': events,
            'themes': themes,
            'category_distribution': stats,
            'total_events': len(events),
            'turning_points_count': sum(1 for e in events if e['is_turning_point'])
        }
    
    def analyze_identity_themes(self, user_id: str) -> Dict[str, any]:
        """Analyze identity themes in detail"""
        narrative = self.get_narrative_identity(user_id)
        
        if not narrative['themes']:
            return {
                'dominant_themes': [],
                'theme_conflicts': [],
                'recommendation': 'Need more conversation data to identify themes'
            }
        
        themes = narrative['themes']
        
        # Get top 3 themes
        dominant = themes[:3] if len(themes) >= 3 else themes
        
        # Detect potential theme conflicts (contradictory themes)
        conflicts = self._detect_theme_conflicts(themes)
        
        return {
            'dominant_themes': dominant,
            'theme_conflicts': conflicts,
            'total_themes': len(themes),
            'avg_theme_strength': sum(t['strength'] for t in themes) / len(themes)
        }
    
    def _detect_theme_conflicts(self, themes: List[Dict]) -> List[Dict]:
        """Detect contradictory themes"""
        conflicts = []
        
        # Define contradictory pairs
        contradictions = [
            ('perfectionism', 'acceptance'),
            ('independence', 'family_oriented'),
            ('ambition', 'contentment'),
            ('optimism', 'realism'),
        ]
        
        theme_names = {t['theme'] for t in themes}
        
        for theme_a, theme_b in contradictions:
            if theme_a in theme_names and theme_b in theme_names:
                strength_a = next(t['strength'] for t in themes if t['theme'] == theme_a)
                strength_b = next(t['strength'] for t in themes if t['theme'] == theme_b)
                
                conflicts.append({
                    'theme_a': theme_a,
                    'theme_b': theme_b,
                    'strength_a': strength_a,
                    'strength_b': strength_b,
                    'tension': abs(strength_a - strength_b)
                })
        
        return conflicts


# Global instance
narrative_builder = NarrativeIdentityBuilder()
