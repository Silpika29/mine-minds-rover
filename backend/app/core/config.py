import os
from typing import List
from pydantic import BaseModel
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mining Safety Rover API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mining_rover.db")
    
    # JWT Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-mining-rover-jwt-key-2026-secure")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost",
        "*"
    ]
    
    # ML & Data
    ML_MODEL_PATH: str = os.getenv("ML_MODEL_PATH", "app/ml/artifacts/random_forest_model.joblib")
    ML_METRICS_PATH: str = os.getenv("ML_METRICS_PATH", "app/ml/artifacts/model_metrics.json")
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", "generated_reports")
    
    # Hardware / Camera URL
    CAMERA_STREAM_URL: str = os.getenv("CAMERA_STREAM_URL", "")
    
    # Simulator Settings
    SIMULATOR_INTERVAL_SECONDS: float = 2.0
    COMMUNICATION_TIMEOUT_SECONDS: int = 15

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
