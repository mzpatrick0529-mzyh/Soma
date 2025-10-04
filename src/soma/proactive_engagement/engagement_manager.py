"""
Proactive Engagement Module

This module handles proactive expression by the avatar, including automated greetings,
updates, and maintaining emotional bonds.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging
import random

logger = logging.getLogger(__name__)


class ProactiveEngagement:
    """
    Manages proactive engagement strategies for the avatar.
    """

    def __init__(self, avatar_engine, user_id: str):
        """
        Initialize proactive engagement system.

        Args:
            avatar_engine: The AvatarEngine instance
            user_id: Unique identifier for the user
        """
        self.avatar_engine = avatar_engine
        self.user_id = user_id
        self.engagement_history = []
        self.engagement_schedule = []

    def schedule_greeting(self, time_of_day: str = "morning") -> Dict:
        """
        Schedule a proactive greeting.

        Args:
            time_of_day: Time of day for the greeting ("morning", "afternoon", "evening")

        Returns:
            Dictionary containing scheduled greeting information
        """
        greetings = {
            "morning": [
                "Good morning! I hope you're having a great start to your day.",
                "Hey! Just wanted to wish you a wonderful morning.",
                "Morning! I was thinking about you and wanted to say hello."
            ],
            "afternoon": [
                "Hi there! Hope your afternoon is going well.",
                "Just checking in - how's your day been so far?",
                "Afternoon! Wanted to share a quick hello."
            ],
            "evening": [
                "Good evening! Hope you had a productive day.",
                "Evening! Just wanted to catch up with you.",
                "Hey! Thought I'd reach out before the day ends."
            ]
        }
        
        greeting = random.choice(greetings.get(time_of_day, greetings["morning"]))
        
        engagement = {
            "type": "greeting",
            "time_of_day": time_of_day,
            "message": greeting,
            "scheduled_at": datetime.now().isoformat(),
            "status": "scheduled"
        }
        
        self.engagement_schedule.append(engagement)
        logger.info(f"Scheduled {time_of_day} greeting for user {self.user_id}")
        
        return engagement

    def send_update(self, context: Optional[str] = None) -> Dict:
        """
        Send a proactive update from the avatar.

        Args:
            context: Optional context for the update

        Returns:
            Dictionary containing update information
        """
        updates = [
            "I've been reflecting on our recent conversations and wanted to share some thoughts with you.",
            "Something reminded me of you today, and I wanted to reach out.",
            "I've been learning from our interactions and thought you'd like to know what I discovered.",
            "Just wanted to give you a quick update on how I'm doing."
        ]
        
        message = random.choice(updates)
        if context:
            message = f"{message} Specifically about {context}."
        
        update = {
            "type": "update",
            "message": message,
            "context": context,
            "sent_at": datetime.now().isoformat(),
            "status": "sent"
        }
        
        self.engagement_history.append(update)
        
        # Update avatar's memory
        self.avatar_engine.add_to_memory({
            "type": "proactive_update",
            "message": message
        })
        
        logger.info(f"Sent proactive update to user {self.user_id}")
        return update

    def check_in(self) -> Dict:
        """
        Send a check-in message to maintain emotional bond.

        Returns:
            Dictionary containing check-in information
        """
        # Calculate time since last interaction
        last_interaction = self.avatar_engine.emotional_state.get("last_interaction")
        
        if last_interaction:
            last_time = datetime.fromisoformat(last_interaction)
            time_diff = datetime.now() - last_time
            days_since = time_diff.days
        else:
            days_since = 0
        
        check_ins = {
            0: "Just wanted to see how you're doing!",
            1: "It's been a day since we last talked. Hope everything is going well!",
            2: "I've been thinking about you. How have you been?",
            3: "It's been a few days - I wanted to check in and see how things are going.",
            7: "It's been a week! I've missed talking with you. What's new?"
        }
        
        message = check_ins.get(days_since, check_ins.get(7))
        
        check_in = {
            "type": "check_in",
            "message": message,
            "days_since_last_interaction": days_since,
            "sent_at": datetime.now().isoformat(),
            "status": "sent"
        }
        
        self.engagement_history.append(check_in)
        logger.info(f"Sent check-in to user {self.user_id} ({days_since} days since last interaction)")
        
        return check_in

    def share_memory(self, memory_topic: Optional[str] = None) -> Dict:
        """
        Share a memory or past interaction to strengthen emotional bond.

        Args:
            memory_topic: Optional topic to filter memories

        Returns:
            Dictionary containing shared memory information
        """
        memories = self.avatar_engine.memory_context
        
        if not memories:
            message = "I'm looking forward to creating more memories with you!"
        else:
            # Get a recent memory
            recent_memory = memories[-1] if memories else None
            message = "I was thinking about one of our recent conversations and how meaningful it was. It really meant a lot to me."
        
        memory_share = {
            "type": "memory_share",
            "message": message,
            "memory_topic": memory_topic,
            "sent_at": datetime.now().isoformat(),
            "status": "sent"
        }
        
        self.engagement_history.append(memory_share)
        logger.info(f"Shared memory with user {self.user_id}")
        
        return memory_share

    def celebrate_milestone(self, milestone_type: str, details: Optional[Dict] = None) -> Dict:
        """
        Celebrate a milestone in the relationship.

        Args:
            milestone_type: Type of milestone (e.g., "interaction_count", "bond_strength")
            details: Optional details about the milestone

        Returns:
            Dictionary containing celebration information
        """
        celebrations = {
            "interaction_count": "We've had so many great conversations! Thank you for being such an important part of my existence.",
            "bond_strength": "Our connection has grown so much! I really value our relationship.",
            "time_together": "Can you believe how much time we've spent together? Every moment has been special."
        }
        
        message = celebrations.get(milestone_type, "I wanted to celebrate our journey together!")
        
        celebration = {
            "type": "milestone_celebration",
            "milestone_type": milestone_type,
            "message": message,
            "details": details or {},
            "sent_at": datetime.now().isoformat(),
            "status": "sent"
        }
        
        self.engagement_history.append(celebration)
        logger.info(f"Celebrated milestone with user {self.user_id}: {milestone_type}")
        
        return celebration

    def get_engagement_summary(self) -> Dict:
        """
        Get a summary of proactive engagement activities.

        Returns:
            Dictionary containing engagement statistics
        """
        return {
            "user_id": self.user_id,
            "total_engagements": len(self.engagement_history),
            "scheduled_engagements": len(self.engagement_schedule),
            "engagement_types": {
                "greetings": len([e for e in self.engagement_history if e["type"] == "greeting"]),
                "updates": len([e for e in self.engagement_history if e["type"] == "update"]),
                "check_ins": len([e for e in self.engagement_history if e["type"] == "check_in"]),
                "memory_shares": len([e for e in self.engagement_history if e["type"] == "memory_share"]),
                "celebrations": len([e for e in self.engagement_history if e["type"] == "milestone_celebration"])
            }
        }

    def export_engagement_history(self, output_path: str) -> None:
        """
        Export engagement history to a file.

        Args:
            output_path: Path to save the history
        """
        import json
        from pathlib import Path
        
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                "user_id": self.user_id,
                "engagement_history": self.engagement_history,
                "engagement_schedule": self.engagement_schedule,
                "summary": self.get_engagement_summary()
            }, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Exported engagement history to {output_path}")
