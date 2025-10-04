"""
Soma - An Emotionally Interactive Digital Memory Platform

Soma aggregates users' multimodal digital footprints (chat histories, audio/video, 
social media) to fine-tune open-source models, creating AI avatars that authentically 
replicate behavioral styles and proactive expression.
"""

__version__ = "0.1.0"
__author__ = "Soma Team"

from .avatar.avatar_engine import AvatarEngine
from .conversation.text_interface import TextConversation
from .conversation.voice_interface import VoiceConversation
from .data_aggregation.aggregator import DataAggregator
from .model_training.trainer import ModelTrainer

__all__ = [
    "AvatarEngine",
    "TextConversation",
    "VoiceConversation",
    "DataAggregator",
    "ModelTrainer",
]
