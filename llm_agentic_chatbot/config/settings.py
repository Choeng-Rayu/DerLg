"""
Configuration Management for DerLg.com AI Agent

This module provides centralized configuration management using Pydantic BaseSettings.
All environment variables are validated on startup with clear error messages.

Environment Variables:
    MODEL_BACKEND: LLM backend to use ("anthropic" or "ollama")
    ANTHROPIC_API_KEY: Anthropic API key (required when MODEL_BACKEND=anthropic)
    OLLAMA_BASE_URL: Ollama server URL (required when MODEL_BACKEND=ollama)
    BACKEND_URL: NestJS backend base URL
    AI_SERVICE_KEY: Service authentication key (min 32 characters)
    REDIS_URL: Redis connection string
    HOST: Server host (default: 0.0.0.0)
    PORT: Server port (default: 8000)
    LOG_LEVEL: Logging level (default: info)
    SENTRY_DSN: Sentry error tracking DSN (optional)
"""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Optional


class Settings(BaseSettings):
    """
    Application settings with environment variable validation.
    
    This class uses Pydantic BaseSettings to load and validate configuration
    from environment variables. It fails fast with clear error messages if
    required configuration is missing or invalid.
    """
    
    # Server Configuration
    HOST: str = Field(
        default="0.0.0.0",
        description="Host to bind the FastAPI server"
    )
    PORT: int = Field(
        default=8000,
        description="Port for the FastAPI server",
        ge=1,
        le=65535
    )
    LOG_LEVEL: str = Field(
        default="info",
        description="Logging level (debug, info, warning, error, critical)"
    )
    
    # Model Backend Configuration
    MODEL_BACKEND: Literal["anthropic", "ollama"] = Field(
        ...,
        description="LLM backend to use: 'anthropic' for Claude API or 'ollama' for local models"
    )
    ANTHROPIC_API_KEY: Optional[str] = Field(
        default=None,
        description="Anthropic API key (required when MODEL_BACKEND=anthropic)"
    )
    OLLAMA_BASE_URL: Optional[str] = Field(
        default=None,
        description="Ollama server base URL (required when MODEL_BACKEND=ollama)"
    )
    
    # Backend API Configuration
    BACKEND_URL: str = Field(
        ...,
        description="NestJS backend base URL (no trailing slash)"
    )
    AI_SERVICE_KEY: str = Field(
        ...,
        min_length=32,
        description="Service authentication key for backend API calls (minimum 32 characters)"
    )
    
    # Redis Configuration
    REDIS_URL: str = Field(
        ...,
        description="Redis connection string for session storage"
    )
    
    # Monitoring Configuration (Optional)
    SENTRY_DSN: Optional[str] = Field(
        default=None,
        description="Sentry DSN for error tracking (optional)"
    )
    
    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra environment variables
    )
    
    @field_validator("ANTHROPIC_API_KEY")
    @classmethod
    def validate_anthropic_key(cls, v: Optional[str], info) -> Optional[str]:
        """
        Validate that ANTHROPIC_API_KEY is provided when MODEL_BACKEND=anthropic.
        
        Args:
            v: The ANTHROPIC_API_KEY value
            info: Validation context containing other field values
            
        Returns:
            The validated API key
            
        Raises:
            ValueError: If MODEL_BACKEND=anthropic but ANTHROPIC_API_KEY is missing
        """
        model_backend = info.data.get("MODEL_BACKEND")
        if model_backend == "anthropic" and not v:
            raise ValueError(
                "ANTHROPIC_API_KEY is required when MODEL_BACKEND=anthropic. "
                "Please set ANTHROPIC_API_KEY in your environment or .env file. "
                "Get your API key from: https://console.anthropic.com/"
            )
        return v
    
    @field_validator("OLLAMA_BASE_URL")
    @classmethod
    def validate_ollama_url(cls, v: Optional[str], info) -> Optional[str]:
        """
        Validate that OLLAMA_BASE_URL is provided when MODEL_BACKEND=ollama.
        
        Args:
            v: The OLLAMA_BASE_URL value
            info: Validation context containing other field values
            
        Returns:
            The validated Ollama URL
            
        Raises:
            ValueError: If MODEL_BACKEND=ollama but OLLAMA_BASE_URL is missing
        """
        model_backend = info.data.get("MODEL_BACKEND")
        if model_backend == "ollama" and not v:
            raise ValueError(
                "OLLAMA_BASE_URL is required when MODEL_BACKEND=ollama. "
                "Please set OLLAMA_BASE_URL in your environment or .env file. "
                "Example: http://localhost:11434"
            )
        return v
    
    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """
        Validate that LOG_LEVEL is a valid logging level.
        
        Args:
            v: The LOG_LEVEL value
            
        Returns:
            The validated log level in lowercase
            
        Raises:
            ValueError: If LOG_LEVEL is not a valid logging level
        """
        valid_levels = {"debug", "info", "warning", "error", "critical"}
        v_lower = v.lower()
        if v_lower not in valid_levels:
            raise ValueError(
                f"LOG_LEVEL must be one of {valid_levels}, got '{v}'. "
                "Please set a valid LOG_LEVEL in your environment or .env file."
            )
        return v_lower
    
    @field_validator("BACKEND_URL")
    @classmethod
    def validate_backend_url(cls, v: str) -> str:
        """
        Validate and normalize BACKEND_URL by removing trailing slashes.
        
        Args:
            v: The BACKEND_URL value
            
        Returns:
            The normalized backend URL without trailing slash
        """
        # Remove trailing slash if present
        return v.rstrip("/")
    
    @field_validator("AI_SERVICE_KEY")
    @classmethod
    def validate_service_key(cls, v: str) -> str:
        """
        Validate that AI_SERVICE_KEY meets security requirements.
        
        Args:
            v: The AI_SERVICE_KEY value
            
        Returns:
            The validated service key
            
        Raises:
            ValueError: If AI_SERVICE_KEY is too short or insecure
        """
        if len(v) < 32:
            raise ValueError(
                f"AI_SERVICE_KEY must be at least 32 characters long, got {len(v)} characters. "
                "Generate a secure key using: openssl rand -hex 32"
            )
        
        # Check if it's a placeholder value
        if "change-this" in v.lower() or "your-" in v.lower() or "xxxxx" in v.lower():
            raise ValueError(
                "AI_SERVICE_KEY appears to be a placeholder value. "
                "Please generate a secure random key using: openssl rand -hex 32"
            )
        
        return v


# Global settings instance
# This will be imported throughout the application
# For testing, this can be skipped by setting SKIP_SETTINGS_INIT=1
import os
if not os.getenv("SKIP_SETTINGS_INIT"):
    settings = Settings()
else:
    settings = None  # type: ignore
