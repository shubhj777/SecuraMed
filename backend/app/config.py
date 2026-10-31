import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SecureMed Gateway"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./securemed.db"

    # Gateway Identity
    GATEWAY_IDENTITY_ID: str = "SECUREMED-GW-01"
    SESSION_EXPIRATION_SECONDS: int = 3600
    RATE_LIMIT_PER_MINUTE: int = 60
    REPLAY_WINDOW_SIZE: int = 100

    # Firmware Storage
    FIRMWARE_STORAGE_PATH: str = "./firmware_storage"
    MAX_FIRMWARE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

    # Admin Credentials
    ADMIN_DEFAULT_USERNAME: str = "admin"
    ADMIN_DEFAULT_PASSWORD: str = "SecureMedAdmin2026!"
    ANALYST_DEFAULT_USERNAME: str = "analyst"
    ANALYST_DEFAULT_PASSWORD: str = "SecureMedAnalyst2026!"

    # JWT / Session Secrets
    SECRET_KEY: str = "securemed-gateway-post-quantum-defense-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
