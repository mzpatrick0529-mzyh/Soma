"""
Avatar Engine Module

This module manages the AI avatar, including behavioral replication, personality traits,
and emotional bonding capabilities.
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class AvatarEngine:
    """
    Manages the AI avatar that replicates user behavioral styles and handles proactive expression.
    """

    def __init__(self, user_id: str, avatar_name: Optional[str] = None):
        """
        Initialize the avatar engine.

        Args:
            user_id: Unique identifier for the user
            avatar_name: Custom name for the avatar
        """
        self.user_id = user_id
        self.avatar_name = avatar_name or f"Avatar_{user_id}"
        self.personality_profile = {}
        self.behavioral_patterns = {}
        self.emotional_state = {
            "bond_strength": 0.0,
            "interaction_count": 0,
            "last_interaction": None
        }
        self.memory_context = []

    def initialize_personality(self, training_data: Dict) -> None:
        """
        Initialize the avatar's personality based on training data.

        Args:
            training_data: Dictionary containing user behavioral data
        """
        # Extract personality traits from training data
        chat_histories = training_data.get("data_sources", {}).get("chat_histories", [])
        
        # Analyze communication style
        self.personality_profile = {
            "communication_style": self._analyze_communication_style(chat_histories),
            "common_topics": self._extract_common_topics(chat_histories),
            "response_patterns": self._identify_response_patterns(chat_histories),
            "emotional_tone": "warm"  # Default, can be analyzed from data
        }
        
        logger.info(f"Initialized personality profile for {self.avatar_name}")

    def _analyze_communication_style(self, chat_data: List[Dict]) -> str:
        """
        Analyze communication style from chat data.

        Args:
            chat_data: List of chat messages

        Returns:
            Communication style description
        """
        # Simple heuristic - in production, use NLP analysis
        if len(chat_data) > 50:
            return "expressive"
        elif len(chat_data) > 20:
            return "moderate"
        else:
            return "reserved"

    def _extract_common_topics(self, chat_data: List[Dict]) -> List[str]:
        """
        Extract common topics from chat data.

        Args:
            chat_data: List of chat messages

        Returns:
            List of common topics
        """
        # Placeholder - in production, use topic modeling
        return ["daily life", "interests", "emotions"]

    def _identify_response_patterns(self, chat_data: List[Dict]) -> Dict:
        """
        Identify response patterns from chat data.

        Args:
            chat_data: List of chat messages

        Returns:
            Dictionary of response patterns
        """
        return {
            "greeting_style": "familiar",
            "farewell_style": "warm",
            "response_length": "moderate"
        }

    def generate_greeting(self) -> str:
        """
        Generate a personalized greeting based on the avatar's personality.

        Returns:
            Greeting message
        """
        greetings = [
            f"Hey there! It's {self.avatar_name}. How have you been?",
            f"Hi! {self.avatar_name} here. I've been thinking about you.",
            f"Hello! This is {self.avatar_name}. Great to connect with you again!",
        ]
        
        # In production, use the fine-tuned model to generate contextual greetings
        greeting = greetings[self.emotional_state["interaction_count"] % len(greetings)]
        
        logger.info(f"Generated greeting: {greeting}")
        return greeting

    def generate_proactive_message(self, context: Optional[str] = None) -> str:
        """
        Generate a proactive message or update.

        Args:
            context: Optional context for message generation

        Returns:
            Proactive message
        """
        messages = [
            "I was just thinking about our last conversation...",
            "Wanted to share something interesting with you.",
            "Hope you're having a good day! Just wanted to check in.",
        ]
        
        # In production, use the fine-tuned model with context
        message = messages[0] if context is None else f"{messages[0]} {context}"
        
        logger.info(f"Generated proactive message: {message}")
        return message

    def update_emotional_bond(self, interaction_quality: float) -> None:
        """
        Update the emotional bond strength based on interaction quality.

        Args:
            interaction_quality: Quality score of the interaction (0.0 to 1.0)
        """
        # Update bond strength using exponential moving average
        alpha = 0.3  # Learning rate
        self.emotional_state["bond_strength"] = (
            alpha * interaction_quality + 
            (1 - alpha) * self.emotional_state["bond_strength"]
        )
        
        self.emotional_state["interaction_count"] += 1
        self.emotional_state["last_interaction"] = datetime.now().isoformat()
        
        logger.info(f"Updated emotional bond: {self.emotional_state['bond_strength']:.2f}")

    def get_emotional_state(self) -> Dict:
        """
        Get the current emotional state and bond strength.

        Returns:
            Dictionary containing emotional state information
        """
        return {
            "avatar_name": self.avatar_name,
            "bond_strength": self.emotional_state["bond_strength"],
            "interaction_count": self.emotional_state["interaction_count"],
            "last_interaction": self.emotional_state["last_interaction"]
        }

    def add_to_memory(self, interaction: Dict) -> None:
        """
        Add an interaction to the avatar's memory context.

        Args:
            interaction: Dictionary containing interaction details
        """
        self.memory_context.append({
            "timestamp": datetime.now().isoformat(),
            "interaction": interaction
        })
        
        # Keep only recent interactions (e.g., last 100)
        if len(self.memory_context) > 100:
            self.memory_context = self.memory_context[-100:]
        
        logger.info(f"Added interaction to memory. Total memories: {len(self.memory_context)}")

    def save_avatar_state(self, output_path: Optional[Path] = None) -> Path:
        """
        Save the avatar's current state to disk.

        Args:
            output_path: Path to save the avatar state

        Returns:
            Path to the saved state file
        """
        if output_path is None:
            output_path = Path(f"./avatars/{self.user_id}/avatar_state.json")
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        state = {
            "user_id": self.user_id,
            "avatar_name": self.avatar_name,
            "personality_profile": self.personality_profile,
            "emotional_state": self.emotional_state,
            "memory_context": self.memory_context
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved avatar state to {output_path}")
        return output_path

    def load_avatar_state(self, input_path: Optional[Path] = None) -> None:
        """
        Load the avatar's state from disk.

        Args:
            input_path: Path to the saved avatar state
        """
        if input_path is None:
            input_path = Path(f"./avatars/{self.user_id}/avatar_state.json")
        
        if not input_path.exists():
            logger.warning(f"No saved state found at {input_path}")
            return
        
        with open(input_path, 'r', encoding='utf-8') as f:
            state = json.load(f)
            self.avatar_name = state.get("avatar_name", self.avatar_name)
            self.personality_profile = state.get("personality_profile", {})
            self.emotional_state = state.get("emotional_state", self.emotional_state)
            self.memory_context = state.get("memory_context", [])
        
        logger.info(f"Loaded avatar state from {input_path}")
