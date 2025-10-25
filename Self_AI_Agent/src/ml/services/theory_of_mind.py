"""
Theory of Mind Module - Model user's mental models of other people

Implements multi-level perspective taking:
- Level 1: User's beliefs about others' knowledge
- Level 2: User's beliefs about others' intentions
- Level 3: Recursive modeling (I think they think I think...)
- Prediction: How user expects others to react
"""

import json
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from collections import defaultdict

from .config import settings
from .db_utils import db


class TheoryOfMindModule:
    """Model how user thinks about others' mental states"""
    
    # Belief attribution patterns
    BELIEF_PATTERNS = [
        r'(?:they|he|she|[A-Z][a-z]+)\s+(?:thinks?|believes?|knows?|assumes?)\s+(?:that\s+)?(.+?)(\.|\,|$)',
        r'(?:in|from)\s+(?:their|his|her)\s+(?:mind|view|perspective|opinion)\s+(.+?)(\.|\,|$)',
        r'(?:they|he|she)\s+(?:probably|likely|must)\s+(?:think|believe|know)\s+(.+?)(\.|\,|$)',
    ]
    
    # Intent patterns
    INTENT_PATTERNS = [
        r'(?:they|he|she|[A-Z][a-z]+)\s+(?:wants?|intends?|plans?|tries?)\s+to\s+(.+?)(\.|\,|$)',
        r'(?:their|his|her)\s+(?:goal|intention|aim)\s+(?:is|was)\s+(?:to\s+)?(.+?)(\.|\,|$)',
        r'(?:trying|attempting)\s+to\s+(.+?)(\.|\,|$)',
    ]
    
    # Reaction prediction patterns
    REACTION_PATTERNS = [
        r'(?:they|he|she)\s+(?:will|would|might)\s+(?:probably\s+)?(.+?)(\.|\,|$)',
        r'(?:I\s+)?(?:expect|predict|think)\s+(?:they|he|she)\s+(?:will|would)\s+(.+?)(\.|\,|$)',
        r'(?:knowing\s+)?(?:them|him|her),\s+(?:they|he|she)\s+(?:will|would)\s+(.+?)(\.|\,|$)',
    ]
    
    # Recursive thinking patterns (I think they think...)
    RECURSIVE_PATTERNS = [
        r'(?:they|he|she)\s+thinks?\s+(?:that\s+)?I\s+(.+?)(\.|\,|$)',
        r'(?:from\s+)?(?:their|his|her)\s+perspective.*?I\s+(.+?)(\.|\,|$)',
    ]
    
    def __init__(self):
        self.mental_models = {}
    
    def build_mental_model(
        self,
        user_id: str,
        target_person: str,
        conversations: List[Dict] = None,
        context: Dict = None
    ) -> Dict[str, any]:
        """
        Build user's mental model of target person
        
        Returns:
            - beliefs: What user thinks target knows/believes
            - intentions: What user thinks target wants
            - predictions: How user expects target to react
            - recursion_level: Depth of perspective taking
        """
        if conversations is None:
            conversations = db.get_user_conversations(user_id, limit=200)
        
        # Filter conversations mentioning target person
        relevant_convs = [
            c for c in conversations
            if target_person.lower() in c['content'].lower()
            and c['role'] == 'user'
        ]
        
        # Extract different aspects of mental model
        beliefs = self._extract_belief_attributions(relevant_convs, target_person)
        intentions = self._extract_intent_models(relevant_convs, target_person)
        predictions = self._extract_reaction_predictions(relevant_convs, target_person)
        recursive = self._extract_recursive_beliefs(relevant_convs, target_person)
        
        model = {
            'target_person': target_person,
            'belief_attributions': beliefs,
            'intent_model': intentions,
            'predicted_reactions': predictions,
            'recursive_beliefs': recursive,
            'recursion_level': len(recursive) + 1 if recursive else 1,
            'confidence': self._calculate_confidence(beliefs, intentions, predictions),
            'context': context or {}
        }
        
        # Save to database
        self._save_mental_model(user_id, model)
        
        return model
    
    def _extract_belief_attributions(
        self,
        conversations: List[Dict],
        target_person: str
    ) -> List[Dict]:
        """Extract what user thinks target believes"""
        beliefs = []
        
        for conv in conversations:
            content = conv['content']
            
            for pattern in self.BELIEF_PATTERNS:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    # Check if this refers to target person
                    context_before = content[max(0, match.start()-50):match.start()]
                    if target_person.lower() in context_before.lower():
                        belief_content = match.group(1).strip()
                        
                        beliefs.append({
                            'content': belief_content,
                            'full_context': match.group(0),
                            'conversation_id': conv.get('conversation_id'),
                            'timestamp': conv.get('timestamp')
                        })
        
        return beliefs
    
    def _extract_intent_models(
        self,
        conversations: List[Dict],
        target_person: str
    ) -> List[Dict]:
        """Extract what user thinks target intends to do"""
        intentions = []
        
        for conv in conversations:
            content = conv['content']
            
            for pattern in self.INTENT_PATTERNS:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    context_before = content[max(0, match.start()-50):match.start()]
                    if target_person.lower() in context_before.lower():
                        intent_content = match.group(1).strip()
                        
                        intentions.append({
                            'intent': intent_content,
                            'full_context': match.group(0),
                            'conversation_id': conv.get('conversation_id'),
                            'timestamp': conv.get('timestamp')
                        })
        
        return intentions
    
    def _extract_reaction_predictions(
        self,
        conversations: List[Dict],
        target_person: str
    ) -> List[Dict]:
        """Extract how user predicts target will react"""
        predictions = []
        
        for conv in conversations:
            content = conv['content']
            
            for pattern in self.REACTION_PATTERNS:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    context_before = content[max(0, match.start()-50):match.start()]
                    if target_person.lower() in context_before.lower():
                        predicted_reaction = match.group(1).strip()
                        
                        predictions.append({
                            'prediction': predicted_reaction,
                            'full_context': match.group(0),
                            'conversation_id': conv.get('conversation_id'),
                            'timestamp': conv.get('timestamp'),
                            'verified': False  # Can be updated later
                        })
        
        return predictions
    
    def _extract_recursive_beliefs(
        self,
        conversations: List[Dict],
        target_person: str
    ) -> List[Dict]:
        """Extract recursive beliefs (they think I think...)"""
        recursive = []
        
        for conv in conversations:
            content = conv['content']
            
            for pattern in self.RECURSIVE_PATTERNS:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    context_before = content[max(0, match.start()-50):match.start()]
                    if target_person.lower() in context_before.lower():
                        recursive_belief = match.group(1).strip()
                        
                        recursive.append({
                            'belief': f"User thinks {target_person} thinks user {recursive_belief}",
                            'level': 2,  # Level 2 recursion
                            'full_context': match.group(0),
                            'conversation_id': conv.get('conversation_id'),
                            'timestamp': conv.get('timestamp')
                        })
        
        return recursive
    
    def _calculate_confidence(
        self,
        beliefs: List[Dict],
        intentions: List[Dict],
        predictions: List[Dict]
    ) -> float:
        """Calculate confidence in mental model"""
        # More data points = higher confidence
        total_points = len(beliefs) + len(intentions) + len(predictions)
        
        if total_points == 0:
            return 0.1
        
        # Baseline confidence from data volume
        confidence = min(total_points / 10.0, 0.7)
        
        # Boost if multiple types of evidence
        evidence_types = sum([
            len(beliefs) > 0,
            len(intentions) > 0,
            len(predictions) > 0
        ])
        confidence += evidence_types * 0.1
        
        return min(confidence, 0.95)
    
    def _save_mental_model(self, user_id: str, model: Dict):
        """Save mental model to database"""
        query = """
            INSERT INTO theory_of_mind
            (user_id, target_person, belief_attribution, intent_model,
             predicted_reaction, recursion_level, context, confidence, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, target_person, context)
            DO UPDATE SET
                belief_attribution = ?,
                intent_model = ?,
                predicted_reaction = ?,
                recursion_level = ?,
                confidence = ?,
                last_updated = ?
        """
        
        now = datetime.now().isoformat()
        context_str = json.dumps(model['context'])
        
        # Serialize complex fields
        beliefs_json = json.dumps(model['belief_attributions'])
        intents_json = json.dumps(model['intent_model'])
        predictions_json = json.dumps(model['predicted_reactions'])
        
        db.execute_update(
            query,
            (
                user_id,
                model['target_person'],
                beliefs_json,
                intents_json,
                predictions_json,
                model['recursion_level'],
                context_str,
                model['confidence'],
                now,
                # For UPDATE clause
                beliefs_json,
                intents_json,
                predictions_json,
                model['recursion_level'],
                model['confidence'],
                now
            )
        )
    
    def get_mental_model(
        self,
        user_id: str,
        target_person: str
    ) -> Optional[Dict]:
        """Retrieve mental model of target person"""
        query = """
            SELECT *
            FROM theory_of_mind
            WHERE user_id = ? AND target_person = ?
            ORDER BY last_updated DESC
            LIMIT 1
        """
        
        result = db.execute_query(
            query,
            (user_id, target_person),
            fetch_one=True
        )
        
        if not result:
            return None
        
        # Deserialize JSON fields
        result['belief_attribution'] = json.loads(result['belief_attribution'])
        result['intent_model'] = json.loads(result['intent_model'])
        result['predicted_reaction'] = json.loads(result['predicted_reaction'])
        if result.get('context'):
            result['context'] = json.loads(result['context'])
        
        return result
    
    def predict_reaction(
        self,
        user_id: str,
        target_person: str,
        situation: str
    ) -> Dict[str, any]:
        """Predict how target will react to situation"""
        # Get mental model
        model = self.get_mental_model(user_id, target_person)
        
        if not model:
            return {
                'prediction': None,
                'confidence': 0.0,
                'reason': f'No mental model found for {target_person}'
            }
        
        # Get previous predictions
        predictions = model['predicted_reaction']
        
        if not predictions:
            return {
                'prediction': 'Unknown - no historical predictions',
                'confidence': 0.2,
                'reason': 'Mental model exists but lacks prediction history'
            }
        
        # Get most recent prediction as baseline
        recent_pred = predictions[0]
        
        # Check accuracy of past predictions
        accuracy_query = """
            SELECT 
                AVG(CASE WHEN was_accurate THEN 1.0 ELSE 0.0 END) as accuracy
            FROM mental_model_accuracy mma
            JOIN theory_of_mind tom ON mma.tom_id = tom.id
            WHERE tom.user_id = ? AND tom.target_person = ?
              AND mma.prediction_type = 'reaction'
        """
        
        accuracy_result = db.execute_query(
            accuracy_query,
            (user_id, target_person),
            fetch_one=True
        )
        
        accuracy = accuracy_result['accuracy'] if accuracy_result else 0.5
        
        # Simple prediction (can be enhanced with ML)
        prediction = f"Based on past patterns: {recent_pred['prediction']}"
        
        confidence = model['confidence'] * (0.5 + accuracy * 0.5)
        
        return {
            'prediction': prediction,
            'confidence': confidence,
            'based_on_model': model['target_person'],
            'model_confidence': model['confidence'],
            'historical_accuracy': accuracy,
            'beliefs_about_person': model['belief_attribution'][:3],  # Top 3
            'known_intentions': model['intent_model'][:3]
        }
    
    def update_prediction_accuracy(
        self,
        user_id: str,
        target_person: str,
        prediction_type: str,
        was_accurate: bool,
        error_description: str = None
    ):
        """Update accuracy tracking for predictions"""
        # Get theory of mind ID
        tom_query = """
            SELECT id FROM theory_of_mind
            WHERE user_id = ? AND target_person = ?
            ORDER BY last_updated DESC
            LIMIT 1
        """
        
        tom_result = db.execute_query(
            tom_query,
            (user_id, target_person),
            fetch_one=True
        )
        
        if not tom_result:
            return
        
        # Insert accuracy record
        insert_query = """
            INSERT INTO mental_model_accuracy
            (tom_id, prediction_type, was_accurate, error_description, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """
        
        db.execute_update(
            insert_query,
            (
                tom_result['id'],
                prediction_type,
                was_accurate,
                error_description,
                datetime.now().isoformat()
            )
        )
    
    def get_all_mental_models(self, user_id: str) -> List[Dict]:
        """Get all mental models for user"""
        query = """
            SELECT 
                target_person,
                recursion_level,
                confidence,
                last_updated
            FROM theory_of_mind
            WHERE user_id = ?
            ORDER BY confidence DESC
        """
        
        models = db.execute_query(query, (user_id,))
        
        # Get accuracy stats for each
        for model in models:
            accuracy_query = """
                SELECT 
                    COUNT(*) as total_predictions,
                    AVG(CASE WHEN was_accurate THEN 1.0 ELSE 0.0 END) as accuracy
                FROM mental_model_accuracy mma
                JOIN theory_of_mind tom ON mma.tom_id = tom.id
                WHERE tom.user_id = ? AND tom.target_person = ?
            """
            
            stats = db.execute_query(
                accuracy_query,
                (user_id, model['target_person']),
                fetch_one=True
            )
            
            model['total_predictions'] = stats['total_predictions'] if stats else 0
            model['prediction_accuracy'] = stats['accuracy'] if stats else None
        
        return models


# Global instance
theory_of_mind = TheoryOfMindModule()
