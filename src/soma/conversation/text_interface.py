"""
Text Conversation Interface

This module provides text-based conversation capabilities with the AI avatar.
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class TextConversation:
    """
    Handles text-based conversations with the AI avatar.
    """

    def __init__(self, avatar_engine, user_id: str):
        """
        Initialize text conversation interface.

        Args:
            avatar_engine: The AvatarEngine instance to interact with
            user_id: Unique identifier for the user
        """
        self.avatar_engine = avatar_engine
        self.user_id = user_id
        self.conversation_history = []

    def send_message(self, message: str) -> str:
        """
        Send a text message to the avatar and get a response.

        Args:
            message: The user's message

        Returns:
            The avatar's response
        """
        # Store user message
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "sender": "user",
            "message": message
        })
        
        # Generate response based on avatar's personality and context
        response = self._generate_response(message)
        
        # Store avatar response
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "sender": "avatar",
            "message": response
        })
        
        # Update avatar's memory
        self.avatar_engine.add_to_memory({
            "type": "text_conversation",
            "user_message": message,
            "avatar_response": response
        })
        
        # Update emotional bond (simple sentiment analysis placeholder)
        quality_score = self._assess_interaction_quality(message, response)
        self.avatar_engine.update_emotional_bond(quality_score)
        
        logger.info(f"Text conversation: User -> Avatar")
        return response

    def _generate_response(self, message: str) -> str:
        """
        Generate a response to the user's message.

        Args:
            message: The user's message

        Returns:
            Generated response
        """
        # In production, this would use the fine-tuned model to generate responses
        # For now, use a simple rule-based approach
        
        message_lower = message.lower()
        
        if any(greeting in message_lower for greeting in ["hello", "hi", "hey"]):
            return f"Hi there! It's great to hear from you. How are you doing?"
        
        elif any(word in message_lower for word in ["how are you", "how're you"]):
            return f"I'm doing well, thanks for asking! I've been thinking about you. What's new with you?"
        
        elif "?" in message:
            return f"That's a great question. Based on what I know about you, I think it depends on the context. What do you think?"
        
        else:
            return f"I hear what you're saying. That's really interesting. Tell me more about that."

    def _assess_interaction_quality(self, user_message: str, avatar_response: str) -> float:
        """
        Assess the quality of the interaction.

        Args:
            user_message: The user's message
            avatar_response: The avatar's response

        Returns:
            Quality score between 0.0 and 1.0
        """
        # Simple heuristic - in production, use sentiment analysis and engagement metrics
        base_quality = 0.7
        
        # Longer messages might indicate higher engagement
        if len(user_message) > 50:
            base_quality += 0.1
        
        # Questions indicate engagement
        if "?" in user_message:
            base_quality += 0.1
        
        return min(base_quality, 1.0)

    def get_conversation_history(self, limit: Optional[int] = None) -> List[Dict]:
        """
        Get the conversation history.

        Args:
            limit: Optional limit on number of messages to return

        Returns:
            List of conversation messages
        """
        if limit:
            return self.conversation_history[-limit:]
        return self.conversation_history

    def clear_history(self) -> None:
        """
        Clear the conversation history.
        """
        self.conversation_history = []
        logger.info("Conversation history cleared")

    def export_conversation(self, output_path: str) -> None:
        """
        Export conversation history to a file.

        Args:
            output_path: Path to save the conversation
        """
        import json
        from pathlib import Path
        
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                "user_id": self.user_id,
                "avatar_name": self.avatar_engine.avatar_name,
                "conversation_history": self.conversation_history
            }, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Exported conversation to {output_path}")
