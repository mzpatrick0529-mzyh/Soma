"""
Value Hierarchy Builder - Construct user's value system and belief hierarchy

This module discovers:
- Core values (e.g., family, achievement, autonomy)
- Value priorities and trade-offs
- Belief systems and worldviews
- Moral principles and ethical frameworks
"""

import json
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from collections import defaultdict
import networkx as nx

from .config import settings
from .db_utils import db


class ValueHierarchyBuilder:
    """Extract and organize user's value hierarchy"""
    
    # Common value categories
    VALUE_KEYWORDS = {
        'family': ['family', 'parent', 'child', 'spouse', 'sibling', 'relative'],
        'achievement': ['success', 'accomplish', 'goal', 'achieve', 'win', 'excel'],
        'autonomy': ['freedom', 'independent', 'choice', 'control', 'autonomy'],
        'relationships': ['friend', 'connection', 'bond', 'loyalty', 'trust'],
        'growth': ['learn', 'grow', 'develop', 'improve', 'better'],
        'health': ['health', 'fitness', 'wellbeing', 'wellness'],
        'integrity': ['honest', 'truth', 'integrity', 'authentic', 'genuine'],
        'creativity': ['creative', 'art', 'imagine', 'innovate', 'original'],
        'security': ['safe', 'secure', 'stable', 'protect', 'certain'],
        'contribution': ['help', 'contribute', 'give', 'support', 'serve'],
        'pleasure': ['enjoy', 'fun', 'pleasure', 'happy', 'joy'],
        'recognition': ['respect', 'recognize', 'appreciate', 'acknowledge', 'status'],
        'justice': ['fair', 'just', 'equal', 'right', 'justice'],
        'spirituality': ['spiritual', 'meaning', 'purpose', 'faith', 'belief'],
        'knowledge': ['know', 'understand', 'wise', 'knowledge', 'insight'],
    }
    
    # Decision indicators
    DECISION_PATTERNS = [
        r'I (?:chose|decided|picked|selected)\s+(.+?)\s+(?:over|instead of|rather than)\s+(.+?)(\.|\,|because)',
        r'more important (?:to me )?(?:is|was)\s+(.+?)(\.|\,|than)',
        r'I value\s+(.+?)\s+(?:more|higher)\s+than\s+(.+?)(\.|\,|$)',
        r'I prioritize\s+(.+?)(\.|\,|$)',
        r'what matters (?:most|more) (?:to me )?(?:is|was)\s+(.+?)(\.|\,|$)',
    ]
    
    # Belief indicators
    BELIEF_PATTERNS = [
        r'I believe (?:that )?\s+(.+?)(\.|\,|$)',
        r'(?:in my opinion|I think)\s+(.+?)(\.|\,|$)',
        r'I\'m convinced (?:that )?\s+(.+?)(\.|\,|$)',
        r'my view is (?:that )?\s+(.+?)(\.|\,|$)',
    ]
    
    def __init__(self):
        self.value_graph = nx.DiGraph()
    
    def build_value_hierarchy(
        self, 
        user_id: str,
        conversations: List[Dict] = None,
        save_to_db: bool = True
    ) -> Dict[str, any]:
        """
        Build complete value hierarchy for user
        
        Returns:
            - values: List of identified values with priorities
            - conflicts: List of value conflicts and resolutions
            - hierarchy: Tree structure of value relationships
        """
        if conversations is None:
            conversations = db.get_user_conversations(user_id, limit=500)
        
        user_messages = [c for c in conversations if c['role'] == 'user']
        
        # Step 1: Identify mentioned values
        value_mentions = self._identify_values(user_messages)
        
        # Step 2: Detect value conflicts
        conflicts = self._detect_value_conflicts(user_messages, value_mentions)
        
        # Step 3: Build hierarchy from conflicts
        hierarchy = self._build_hierarchy_from_conflicts(value_mentions, conflicts)
        
        # Step 4: Extract beliefs
        beliefs = self._extract_beliefs(user_messages)
        
        if save_to_db:
            self._save_value_hierarchy(user_id, hierarchy, conflicts, beliefs)
        
        return {
            'values': hierarchy,
            'conflicts': conflicts,
            'beliefs': beliefs,
            'value_graph': self._export_graph()
        }
    
    def _identify_values(self, messages: List[Dict]) -> Dict[str, List[Dict]]:
        """Identify value mentions in conversations"""
        value_mentions = defaultdict(list)
        
        for msg in messages:
            content = msg['content'].lower()
            
            for value_name, keywords in self.VALUE_KEYWORDS.items():
                for keyword in keywords:
                    if keyword in content:
                        # Get context around keyword
                        pattern = rf'.{{0,50}}{re.escape(keyword)}.{{0,50}}'
                        matches = re.finditer(pattern, content, re.IGNORECASE)
                        
                        for match in matches:
                            context = match.group(0)
                            value_mentions[value_name].append({
                                'context': context,
                                'keyword': keyword,
                                'conversation_id': msg['conversation_id'],
                                'timestamp': msg['timestamp']
                            })
        
        return dict(value_mentions)
    
    def _detect_value_conflicts(
        self, 
        messages: List[Dict],
        value_mentions: Dict[str, List[Dict]]
    ) -> List[Dict]:
        """Detect situations where values were in conflict"""
        conflicts = []
        
        for msg in messages:
            content = msg['content']
            
            # Look for decision patterns
            for pattern in self.DECISION_PATTERNS:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    if len(match.groups()) >= 2:
                        chosen = match.group(1).strip()
                        rejected = match.group(2).strip()
                        
                        # Map to values
                        chosen_value = self._map_text_to_value(chosen)
                        rejected_value = self._map_text_to_value(rejected)
                        
                        if chosen_value and rejected_value:
                            # Extract reasoning if present
                            reasoning = ""
                            if 'because' in content[match.end():match.end()+100]:
                                reasoning_match = re.search(
                                    r'because\s+(.+?)(\.|\,|$)',
                                    content[match.end():match.end()+100],
                                    re.IGNORECASE
                                )
                                if reasoning_match:
                                    reasoning = reasoning_match.group(1).strip()
                            
                            conflicts.append({
                                'value_a': chosen_value,
                                'value_b': rejected_value,
                                'chosen': chosen_value,
                                'context': match.group(0),
                                'reasoning': reasoning,
                                'conversation_id': msg['conversation_id'],
                                'timestamp': msg['timestamp']
                            })
        
        return conflicts
    
    def _map_text_to_value(self, text: str) -> Optional[str]:
        """Map text description to value category"""
        text_lower = text.lower()
        
        # Count keyword matches for each value
        value_scores = {}
        for value_name, keywords in self.VALUE_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                value_scores[value_name] = score
        
        if not value_scores:
            return None
        
        # Return value with highest score
        return max(value_scores.items(), key=lambda x: x[1])[0]
    
    def _build_hierarchy_from_conflicts(
        self, 
        value_mentions: Dict[str, List[Dict]],
        conflicts: List[Dict]
    ) -> List[Dict]:
        """Build hierarchical structure from value conflicts"""
        # Initialize all values with base priority
        values = {}
        for value_name, mentions in value_mentions.items():
            values[value_name] = {
                'name': value_name,
                'priority_score': 0.5,
                'mention_count': len(mentions),
                'conflict_wins': 0,
                'conflict_losses': 0,
                'examples': [m['context'] for m in mentions[:3]]
            }
        
        # Update priorities based on conflicts
        for conflict in conflicts:
            chosen = conflict['chosen']
            other = conflict['value_a'] if conflict['value_a'] != chosen else conflict['value_b']
            
            if chosen in values:
                values[chosen]['conflict_wins'] += 1
                values[chosen]['priority_score'] += 0.05
            
            if other in values:
                values[other]['conflict_losses'] += 1
                values[other]['priority_score'] -= 0.03
        
        # Normalize priority scores
        if values:
            max_score = max(v['priority_score'] for v in values.values())
            min_score = min(v['priority_score'] for v in values.values())
            score_range = max_score - min_score if max_score != min_score else 1
            
            for value in values.values():
                value['priority_score'] = (
                    (value['priority_score'] - min_score) / score_range
                )
        
        # Sort by priority
        sorted_values = sorted(
            values.values(), 
            key=lambda x: x['priority_score'], 
            reverse=True
        )
        
        return sorted_values
    
    def _extract_beliefs(self, messages: List[Dict]) -> List[Dict]:
        """Extract belief statements"""
        beliefs = []
        
        for msg in messages:
            content = msg['content']
            
            for pattern in self.BELIEF_PATTERNS:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    belief_text = match.group(1).strip()
                    
                    if len(belief_text) > 10:  # Filter out too short
                        beliefs.append({
                            'belief': belief_text,
                            'context': match.group(0),
                            'conversation_id': msg['conversation_id'],
                            'timestamp': msg['timestamp']
                        })
        
        return beliefs
    
    def _save_value_hierarchy(
        self,
        user_id: str,
        hierarchy: List[Dict],
        conflicts: List[Dict],
        beliefs: List[Dict]
    ):
        """Save value hierarchy to database"""
        # Save values
        for idx, value in enumerate(hierarchy):
            # Check if value exists
            existing = db.execute_query(
                "SELECT id FROM value_hierarchy WHERE user_id = ? AND value_name = ?",
                (user_id, value['name']),
                fetch_one=True
            )
            
            if existing:
                # Update existing
                query = """
                    UPDATE value_hierarchy
                    SET priority_score = ?,
                        manifestation_examples = ?,
                        last_updated = ?
                    WHERE id = ?
                """
                db.execute_update(
                    query,
                    (
                        value['priority_score'],
                        json.dumps(value['examples']),
                        datetime.now().isoformat(),
                        existing['id']
                    )
                )
            else:
                # Insert new
                query = """
                    INSERT INTO value_hierarchy
                    (user_id, value_name, priority_score, description,
                     manifestation_examples, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?)
                """
                db.execute_update(
                    query,
                    (
                        user_id,
                        value['name'],
                        value['priority_score'],
                        f"Mentioned {value['mention_count']} times",
                        json.dumps(value['examples']),
                        datetime.now().isoformat()
                    )
                )
        
        # Save conflicts
        for conflict in conflicts:
            # Get value IDs
            value_a_id = db.execute_query(
                "SELECT id FROM value_hierarchy WHERE user_id = ? AND value_name = ?",
                (user_id, conflict['value_a']),
                fetch_one=True
            )
            value_b_id = db.execute_query(
                "SELECT id FROM value_hierarchy WHERE user_id = ? AND value_name = ?",
                (user_id, conflict['value_b']),
                fetch_one=True
            )
            chosen_id = db.execute_query(
                "SELECT id FROM value_hierarchy WHERE user_id = ? AND value_name = ?",
                (user_id, conflict['chosen']),
                fetch_one=True
            )
            
            if value_a_id and value_b_id and chosen_id:
                query = """
                    INSERT INTO value_conflicts
                    (user_id, value_a_id, value_b_id, chosen_value_id,
                     context, reasoning, confidence, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                db.execute_update(
                    query,
                    (
                        user_id,
                        value_a_id['id'],
                        value_b_id['id'],
                        chosen_id['id'],
                        conflict['context'],
                        conflict.get('reasoning', ''),
                        0.7,
                        conflict['timestamp']
                    )
                )
    
    def get_value_hierarchy(self, user_id: str) -> Dict[str, any]:
        """Get user's value hierarchy from database"""
        query = """
            SELECT *
            FROM value_hierarchy
            WHERE user_id = ?
            ORDER BY priority_score DESC
        """
        
        values = db.execute_query(query, (user_id,))
        
        for value in values:
            if value.get('manifestation_examples'):
                value['manifestation_examples'] = json.loads(
                    value['manifestation_examples']
                )
        
        # Get conflict statistics
        conflict_query = """
            SELECT 
                vh.value_name,
                COUNT(*) as conflict_count,
                SUM(CASE WHEN vc.chosen_value_id = vh.id THEN 1 ELSE 0 END) as wins
            FROM value_conflicts vc
            JOIN value_hierarchy vh ON vc.value_a_id = vh.id OR vc.value_b_id = vh.id
            WHERE vh.user_id = ?
            GROUP BY vh.value_name
        """
        
        conflicts = db.execute_query(conflict_query, (user_id,))
        
        return {
            'values': values,
            'conflict_stats': conflicts,
            'total_values': len(values)
        }
    
    def predict_decision(
        self, 
        user_id: str, 
        option_a: str, 
        option_b: str
    ) -> Dict[str, any]:
        """Predict which option user will choose based on values"""
        # Map options to values
        value_a = self._map_text_to_value(option_a)
        value_b = self._map_text_to_value(option_b)
        
        if not value_a or not value_b:
            return {
                'prediction': None,
                'confidence': 0.0,
                'reason': 'Could not map options to known values'
            }
        
        # Get value priorities
        hierarchy = self.get_value_hierarchy(user_id)
        value_scores = {
            v['value_name']: v['priority_score'] 
            for v in hierarchy['values']
        }
        
        score_a = value_scores.get(value_a, 0.5)
        score_b = value_scores.get(value_b, 0.5)
        
        # Check historical conflicts
        conflict_query = """
            SELECT chosen_value_id, COUNT(*) as count
            FROM value_conflicts vc
            JOIN value_hierarchy vh_a ON vc.value_a_id = vh_a.id
            JOIN value_hierarchy vh_b ON vc.value_b_id = vh_b.id
            WHERE vc.user_id = ?
              AND ((vh_a.value_name = ? AND vh_b.value_name = ?)
                   OR (vh_a.value_name = ? AND vh_b.value_name = ?))
            GROUP BY chosen_value_id
        """
        
        historical = db.execute_query(
            conflict_query,
            (user_id, value_a, value_b, value_b, value_a)
        )
        
        # Combine priority scores and historical data
        confidence = abs(score_a - score_b)
        
        if historical:
            # Boost confidence if historical data exists
            confidence = min(confidence + 0.2, 0.95)
        
        prediction = value_a if score_a > score_b else value_b
        
        return {
            'prediction': prediction,
            'confidence': confidence,
            'value_a': value_a,
            'value_b': value_b,
            'score_a': score_a,
            'score_b': score_b,
            'historical_data': historical,
            'reason': f"{prediction} has higher priority ({max(score_a, score_b):.2f}) in user's value hierarchy"
        }
    
    def _export_graph(self) -> Dict[str, any]:
        """Export value graph structure"""
        return {
            'nodes': list(self.value_graph.nodes()),
            'edges': [
                {
                    'source': u,
                    'target': v,
                    'data': self.value_graph[u][v]
                }
                for u, v in self.value_graph.edges()
            ]
        }


# Global instance
value_builder = ValueHierarchyBuilder()
