"""
Emotional Reasoning Engine - Deep emotional state modeling

Implements the full emotional processing pipeline:
1. Trigger Detection: Identify events that evoke emotions
2. Appraisal: Cognitive evaluation of situation
3. Emotion Generation: Determine emotion type and intensity
4. Regulation: Apply coping strategies
5. Expression: Context-appropriate emotional output
"""

import json
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from collections import defaultdict

from .config import settings
from .db_utils import db


class EmotionalReasoningEngine:
    """Model user's emotional reasoning patterns"""
    
    # Emotion keywords (based on Plutchik's wheel + extensions)
    EMOTION_KEYWORDS = {
        'joy': ['happy', 'joy', 'delight', 'pleased', 'glad', 'cheerful', 'ecstatic'],
        'sadness': ['sad', 'unhappy', 'depressed', 'down', 'miserable', 'grief'],
        'anger': ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated'],
        'fear': ['afraid', 'scared', 'anxious', 'worried', 'nervous', 'terrified'],
        'disgust': ['disgusted', 'revolted', 'repulsed', 'sick', 'grossed out'],
        'surprise': ['surprised', 'shocked', 'amazed', 'astonished', 'startled'],
        'trust': ['trust', 'confident', 'secure', 'assured'],
        'anticipation': ['excited', 'eager', 'hopeful', 'looking forward'],
        'contempt': ['contempt', 'disdain', 'scorn', 'disrespect'],
        'shame': ['ashamed', 'embarrassed', 'humiliated', 'guilty'],
        'pride': ['proud', 'accomplished', 'triumphant'],
        'love': ['love', 'affection', 'care', 'adore', 'cherish'],
    }
    
    # Regulation strategies
    REGULATION_STRATEGIES = {
        'reappraisal': ['realize', 'perspective', 'silver lining', 'look at it differently'],
        'suppression': ['hold it in', 'hide', 'not show', 'keep to myself'],
        'expression': ['told them', 'let it out', 'expressed', 'showed'],
        'distraction': ['took my mind off', 'focused on', 'distracted myself'],
        'problem_solving': ['dealt with', 'fixed', 'solved', 'addressed'],
        'social_support': ['talked to', 'reached out', 'support', 'help from'],
        'acceptance': ['accept', 'let it be', 'come to terms', 'okay with'],
    }
    
    # Appraisal dimensions (from cognitive appraisal theory)
    APPRAISAL_INDICATORS = {
        'goal_relevance': ['important', 'matters', 'care about', 'affects'],
        'goal_congruence': ['want', 'hope', 'wish', 'desire', 'prefer'],
        'coping_potential': ['can handle', 'able to', 'control', 'deal with'],
        'norm_compatibility': ['should', 'ought', 'right', 'wrong', 'fair'],
    }
    
    def __init__(self):
        self.emotion_patterns = {}
    
    def analyze_emotional_state(
        self,
        user_id: str,
        text: str,
        context: Dict = None,
        conversation_id: str = None
    ) -> Dict[str, any]:
        """
        Analyze emotional state from text using full pipeline
        
        Returns:
            - trigger: What caused the emotion
            - appraisal: Cognitive evaluation
            - emotion: Detected emotion type and intensity
            - regulation: Strategy used (if any)
            - expression: How emotion was expressed
        """
        # Step 1: Detect trigger
        trigger = self._detect_trigger(text, context)
        
        # Step 2: Appraisal
        appraisal = self._cognitive_appraisal(text, trigger)
        
        # Step 3: Determine emotion
        emotion_type, intensity = self._determine_emotion(text, appraisal)
        
        # Step 4: Detect regulation
        regulation = self._detect_regulation_strategy(text)
        
        # Step 5: Extract expression
        expression = self._extract_expression(text, emotion_type)
        
        result = {
            'trigger': trigger,
            'appraisal': appraisal,
            'emotion_type': emotion_type,
            'intensity': intensity,
            'regulation_strategy': regulation,
            'expression': expression,
            'context': context or {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Save to database
        self._save_emotional_state(user_id, result, conversation_id)
        
        # Update patterns
        self._update_emotional_patterns(user_id, trigger, emotion_type, intensity, regulation)
        
        return result
    
    def _detect_trigger(self, text: str, context: Dict = None) -> str:
        """Detect what triggered the emotional response"""
        text_lower = text.lower()
        
        # Trigger indicators
        trigger_patterns = [
            r'when (.+?)(made me|I felt|I became)',
            r'after (.+?)(I felt|I was|I became)',
            r'because (.+?)(I felt|I was|I became)',
            r'(.+?)\s+(?:made|makes) me (?:feel|felt)',
        ]
        
        for pattern in trigger_patterns:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Fallback: use context if available
        if context:
            trigger_parts = []
            if context.get('time_context'):
                trigger_parts.append(context['time_context'])
            if context.get('social_context'):
                trigger_parts.append(context['social_context'].get('participants', ''))
            if trigger_parts:
                return ', '.join(filter(None, trigger_parts))
        
        # Last resort: first clause of message
        first_sentence = text.split('.')[0] if '.' in text else text
        return first_sentence[:100]
    
    def _cognitive_appraisal(self, text: str, trigger: str) -> Dict[str, any]:
        """Perform cognitive appraisal of situation"""
        text_lower = text.lower()
        
        appraisal = {
            'goal_relevance': 0.5,
            'goal_congruence': 0.5,
            'coping_potential': 0.5,
            'norm_compatibility': 0.5
        }
        
        # Analyze each dimension
        for dimension, indicators in self.APPRAISAL_INDICATORS.items():
            score = 0
            matches = 0
            
            for indicator in indicators:
                if indicator in text_lower:
                    matches += 1
                    # Determine if positive or negative context
                    context = text_lower[
                        max(0, text_lower.index(indicator) - 20):
                        min(len(text_lower), text_lower.index(indicator) + 20)
                    ]
                    
                    # Simple sentiment
                    negative_words = ['not', 'no', 'never', "don't", "can't", "won't"]
                    if any(neg in context for neg in negative_words):
                        score -= 0.3
                    else:
                        score += 0.3
            
            if matches > 0:
                appraisal[dimension] = max(0, min(1, 0.5 + score / max(matches, 1)))
        
        return appraisal
    
    def _determine_emotion(
        self, 
        text: str, 
        appraisal: Dict
    ) -> Tuple[str, float]:
        """Determine emotion type and intensity from appraisal"""
        text_lower = text.lower()
        
        # Count emotion keyword matches
        emotion_scores = {}
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            score = sum(
                1 for keyword in keywords 
                if keyword in text_lower
            )
            if score > 0:
                emotion_scores[emotion] = score
        
        if not emotion_scores:
            # Use appraisal to infer emotion
            return self._infer_emotion_from_appraisal(appraisal)
        
        # Get dominant emotion
        dominant_emotion = max(emotion_scores.items(), key=lambda x: x[1])[0]
        
        # Calculate intensity from various factors
        intensity = 0.5
        
        # Factor 1: Keyword count
        keyword_count = emotion_scores[dominant_emotion]
        intensity += min(keyword_count * 0.1, 0.2)
        
        # Factor 2: Intensifiers
        intensifiers = ['very', 'really', 'extremely', 'so', 'incredibly']
        if any(word in text_lower for word in intensifiers):
            intensity += 0.2
        
        # Factor 3: Exclamation marks
        intensity += min(text.count('!') * 0.05, 0.15)
        
        # Factor 4: Capitalization
        if any(word.isupper() and len(word) > 2 for word in text.split()):
            intensity += 0.1
        
        intensity = max(0.1, min(1.0, intensity))
        
        return dominant_emotion, intensity
    
    def _infer_emotion_from_appraisal(self, appraisal: Dict) -> Tuple[str, float]:
        """Infer emotion from appraisal dimensions"""
        goal_rel = appraisal['goal_relevance']
        goal_cong = appraisal['goal_congruence']
        coping = appraisal['coping_potential']
        norm = appraisal['norm_compatibility']
        
        # Simple rule-based inference
        if goal_cong > 0.6:
            return 'joy', 0.6
        elif goal_cong < 0.4 and coping < 0.5:
            return 'sadness', 0.5
        elif goal_cong < 0.4 and coping > 0.5:
            return 'anger', 0.6
        elif goal_rel > 0.6 and coping < 0.5:
            return 'fear', 0.5
        else:
            return 'neutral', 0.3
    
    def _detect_regulation_strategy(self, text: str) -> Optional[str]:
        """Detect emotion regulation strategy used"""
        text_lower = text.lower()
        
        strategy_scores = {}
        for strategy, indicators in self.REGULATION_STRATEGIES.items():
            score = sum(1 for indicator in indicators if indicator in text_lower)
            if score > 0:
                strategy_scores[strategy] = score
        
        if not strategy_scores:
            return None
        
        return max(strategy_scores.items(), key=lambda x: x[1])[0]
    
    def _extract_expression(self, text: str, emotion_type: str) -> str:
        """Extract how emotion was expressed"""
        # Look for direct expression markers
        expression_patterns = [
            r'I (?:said|told|expressed|showed)\s+(.+?)(\.|\,|$)',
            r'my (?:reaction|response) was\s+(.+?)(\.|\,|$)',
        ]
        
        for pattern in expression_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Fallback: linguistic markers
        markers = {
            'joy': ['haha', 'lol', '😊', '😄', '!'],
            'sadness': ['...', '😢', '😞'],
            'anger': ['!!!', '😠', '😡'],
            'fear': ['...', '😰', '😨'],
        }
        
        found_markers = []
        for marker in markers.get(emotion_type, []):
            if marker in text:
                found_markers.append(marker)
        
        if found_markers:
            return f"Used markers: {', '.join(found_markers)}"
        
        return "Implicit expression"
    
    def _save_emotional_state(
        self,
        user_id: str,
        state: Dict,
        conversation_id: str = None
    ):
        """Save emotional state to database"""
        query = """
            INSERT INTO emotional_states
            (user_id, trigger_event, context_factors, appraisal_result,
             emotion_type, intensity, regulation_strategy, expression_output,
             conversation_id, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        db.execute_update(
            query,
            (
                user_id,
                state['trigger'],
                json.dumps(state['context']),
                json.dumps(state['appraisal']),
                state['emotion_type'],
                state['intensity'],
                state['regulation_strategy'],
                state['expression'],
                conversation_id,
                state['timestamp']
            )
        )
    
    def _update_emotional_patterns(
        self,
        user_id: str,
        trigger: str,
        emotion: str,
        intensity: float,
        regulation: Optional[str]
    ):
        """Update learned emotional patterns"""
        # Normalize trigger to pattern
        trigger_pattern = self._normalize_trigger(trigger)
        
        query = """
            INSERT INTO emotional_patterns
            (user_id, trigger_pattern, typical_emotion, typical_intensity,
             typical_regulation, occurrence_count, last_seen)
            VALUES (?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(user_id, trigger_pattern, typical_emotion)
            DO UPDATE SET
                typical_intensity = (typical_intensity * occurrence_count + ?) / (occurrence_count + 1),
                typical_regulation = ?,
                occurrence_count = occurrence_count + 1,
                last_seen = ?
        """
        
        now = datetime.now().isoformat()
        db.execute_update(
            query,
            (user_id, trigger_pattern, emotion, intensity, regulation, now,
             intensity, regulation, now)
        )
    
    def _normalize_trigger(self, trigger: str) -> str:
        """Normalize trigger text to pattern"""
        # Remove specific names, dates, numbers
        normalized = re.sub(r'\b[A-Z][a-z]+\b', '[NAME]', trigger)
        normalized = re.sub(r'\b\d+\b', '[NUM]', normalized)
        normalized = normalized.lower().strip()
        return normalized[:100]
    
    def get_emotional_trajectory(
        self,
        user_id: str,
        time_window_days: int = 30
    ) -> Dict[str, any]:
        """Get emotional trajectory over time"""
        query = """
            SELECT 
                DATE(timestamp) as date,
                emotion_type,
                AVG(intensity) as avg_intensity,
                COUNT(*) as count
            FROM emotional_states
            WHERE user_id = ?
              AND timestamp >= datetime('now', '-' || ? || ' days')
            GROUP BY DATE(timestamp), emotion_type
            ORDER BY date DESC
        """
        
        trajectory = db.execute_query(query, (user_id, time_window_days))
        
        # Get dominant emotions
        emotion_query = """
            SELECT 
                emotion_type,
                COUNT(*) as count,
                AVG(intensity) as avg_intensity
            FROM emotional_states
            WHERE user_id = ?
              AND timestamp >= datetime('now', '-' || ? || ' days')
            GROUP BY emotion_type
            ORDER BY count DESC
        """
        
        emotions = db.execute_query(emotion_query, (user_id, time_window_days))
        
        return {
            'trajectory': trajectory,
            'dominant_emotions': emotions,
            'time_window_days': time_window_days
        }
    
    def predict_emotional_response(
        self,
        user_id: str,
        situation: str,
        context: Dict = None
    ) -> Dict[str, any]:
        """Predict how user will emotionally respond to situation"""
        # Normalize situation to match patterns
        situation_pattern = self._normalize_trigger(situation)
        
        # Look for matching patterns
        query = """
            SELECT 
                typical_emotion,
                typical_intensity,
                typical_regulation,
                occurrence_count
            FROM emotional_patterns
            WHERE user_id = ?
            ORDER BY occurrence_count DESC
        """
        
        patterns = db.execute_query(query, (user_id,))
        
        if not patterns:
            return {
                'prediction': None,
                'confidence': 0.0,
                'reason': 'No emotional patterns found'
            }
        
        # Simple pattern matching (can be enhanced with embeddings)
        best_match = patterns[0]
        
        confidence = min(best_match['occurrence_count'] / 10.0, 0.8)
        
        return {
            'predicted_emotion': best_match['typical_emotion'],
            'predicted_intensity': best_match['typical_intensity'],
            'predicted_regulation': best_match['typical_regulation'],
            'confidence': confidence,
            'based_on_occurrences': best_match['occurrence_count']
        }


# Global instance
emotional_engine = EmotionalReasoningEngine()
