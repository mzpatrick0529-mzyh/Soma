"""
Soma Platform Configuration

Configuration settings for the Soma AI Avatar platform.
"""

import os
from pathlib import Path


class Config:
    """
    Configuration class for Soma platform.
    """
    
    # Base paths
    BASE_DIR = Path(__file__).parent.parent
    DATA_DIR = BASE_DIR / "data"
    MODELS_DIR = BASE_DIR / "models"
    AVATARS_DIR = BASE_DIR / "avatars"
    VIDEOS_DIR = BASE_DIR / "videos"
    AUDIO_DIR = BASE_DIR / "audio"
    
    # Database settings
    DATABASE_PATH = BASE_DIR / "soma_database.db"
    
    # Model settings
    DEFAULT_MODEL = "gpt2"
    TRAINING_EPOCHS = 3
    BATCH_SIZE = 8
    LEARNING_RATE = 5e-5
    
    # Avatar settings
    MAX_MEMORY_CONTEXT = 100
    BOND_STRENGTH_ALPHA = 0.3
    
    # Engagement settings
    CHECK_IN_FREQUENCY_DAYS = 3
    PROACTIVE_ENGAGEMENT_ENABLED = True
    
    # API settings (for future web interface)
    API_HOST = os.getenv("SOMA_API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("SOMA_API_PORT", "8000"))
    
    # Logging settings
    LOG_LEVEL = os.getenv("SOMA_LOG_LEVEL", "INFO")
    LOG_FILE = BASE_DIR / "soma.log"
    
    @classmethod
    def create_directories(cls):
        """Create necessary directories if they don't exist."""
        for directory in [cls.DATA_DIR, cls.MODELS_DIR, cls.AVATARS_DIR, 
                         cls.VIDEOS_DIR, cls.AUDIO_DIR]:
            directory.mkdir(parents=True, exist_ok=True)


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    LOG_LEVEL = "DEBUG"


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    LOG_LEVEL = "WARNING"


# Default configuration
config = Config()
