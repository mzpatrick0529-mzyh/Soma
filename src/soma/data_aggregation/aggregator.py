"""
Data Aggregation Module

This module handles the collection and aggregation of multimodal digital footprints
including chat histories, audio/video content, and social media data.
"""

from typing import Dict, List, Optional, Union
from pathlib import Path
import json
import logging

logger = logging.getLogger(__name__)


class DataAggregator:
    """
    Aggregates users' multimodal digital footprints from various sources.
    """

    def __init__(self, user_id: str, storage_path: Optional[Path] = None):
        """
        Initialize the data aggregator for a specific user.

        Args:
            user_id: Unique identifier for the user
            storage_path: Path to store aggregated data
        """
        self.user_id = user_id
        self.storage_path = storage_path or Path(f"./data/{user_id}")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.data_sources = {
            "chat_histories": [],
            "audio_files": [],
            "video_files": [],
            "social_media": []
        }

    def add_chat_history(self, chat_data: Union[Dict, List[Dict]]) -> None:
        """
        Add chat history data to the aggregator.

        Args:
            chat_data: Dictionary or list of dictionaries containing chat messages
        """
        if isinstance(chat_data, dict):
            chat_data = [chat_data]
        
        self.data_sources["chat_histories"].extend(chat_data)
        logger.info(f"Added {len(chat_data)} chat messages for user {self.user_id}")

    def add_audio_file(self, audio_path: Union[str, Path]) -> None:
        """
        Add audio file to the aggregator.

        Args:
            audio_path: Path to the audio file
        """
        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        self.data_sources["audio_files"].append(str(audio_path))
        logger.info(f"Added audio file {audio_path} for user {self.user_id}")

    def add_video_file(self, video_path: Union[str, Path]) -> None:
        """
        Add video file to the aggregator.

        Args:
            video_path: Path to the video file
        """
        video_path = Path(video_path)
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        self.data_sources["video_files"].append(str(video_path))
        logger.info(f"Added video file {video_path} for user {self.user_id}")

    def add_social_media_data(self, platform: str, data: Union[Dict, List[Dict]]) -> None:
        """
        Add social media data to the aggregator.

        Args:
            platform: Name of the social media platform
            data: Dictionary or list of dictionaries containing social media posts
        """
        if isinstance(data, dict):
            data = [data]
        
        social_entry = {
            "platform": platform,
            "data": data
        }
        self.data_sources["social_media"].append(social_entry)
        logger.info(f"Added {len(data)} posts from {platform} for user {self.user_id}")

    def get_aggregated_data(self) -> Dict:
        """
        Get all aggregated data for the user.

        Returns:
            Dictionary containing all aggregated data sources
        """
        return {
            "user_id": self.user_id,
            "data_sources": self.data_sources,
            "total_chat_messages": len(self.data_sources["chat_histories"]),
            "total_audio_files": len(self.data_sources["audio_files"]),
            "total_video_files": len(self.data_sources["video_files"]),
            "total_social_media_entries": len(self.data_sources["social_media"])
        }

    def save_aggregated_data(self) -> Path:
        """
        Save aggregated data to disk.

        Returns:
            Path to the saved data file
        """
        output_path = self.storage_path / "aggregated_data.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.get_aggregated_data(), f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved aggregated data to {output_path}")
        return output_path

    def load_aggregated_data(self) -> None:
        """
        Load previously saved aggregated data from disk.
        """
        input_path = self.storage_path / "aggregated_data.json"
        if not input_path.exists():
            logger.warning(f"No saved data found at {input_path}")
            return
        
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.data_sources = data.get("data_sources", self.data_sources)
        
        logger.info(f"Loaded aggregated data from {input_path}")
