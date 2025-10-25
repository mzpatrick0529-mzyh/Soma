"""
Configuration for ML services
"""
import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel


class Settings(BaseModel):
    """ML service settings"""
    
    # Database
    DATABASE_PATH: str = os.getenv(
        "DATABASE_PATH",
        str(Path(__file__).parent.parent.parent / "soma.db")
    )
    
    # AI Models
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # spaCy model
    SPACY_MODEL: str = "en_core_web_sm"
    
    # Cache settings
    ENABLE_CACHE: bool = True
    CACHE_TTL_SECONDS: int = 3600  # 1 hour
    
    # Performance
    MAX_BATCH_SIZE: int = 32
    REASONING_DEPTH_LIMIT: int = 5  # Max reasoning chain depth
    TOM_RECURSION_LIMIT: int = 3  # Max "I think they think..." depth
    
    # Thresholds
    MIN_CONFIDENCE: float = 0.3
    VALUE_CONFLICT_THRESHOLD: float = 0.5
    EMOTION_INTENSITY_THRESHOLD: float = 0.4
    
    # Model paths
    MODELS_DIR: Path = Path(__file__).parent / "models"
    
    class Config:
        case_sensitive = True


settings = Settings()

# Ensure models directory exists
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
