"""
Unit tests for configuration settings.

Tests validate that Pydantic BaseSettings correctly loads and validates
environment variables with proper error messages for missing or invalid values.
"""

import os
import pytest
from pydantic import ValidationError

# Skip global settings initialization during tests
os.environ["SKIP_SETTINGS_INIT"] = "1"

from config.settings import Settings


def test_settings_with_anthropic_backend(monkeypatch):
    """Test settings load correctly with Anthropic backend."""
    # Set required environment variables
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key-1234567890")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "a" * 32)  # 32 character key
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    # Create settings instance
    settings = Settings()
    
    # Verify values
    assert settings.MODEL_BACKEND == "anthropic"
    assert settings.ANTHROPIC_API_KEY == "sk-ant-test-key-1234567890"
    assert settings.BACKEND_URL == "http://localhost:3001"
    assert settings.AI_SERVICE_KEY == "a" * 32
    assert settings.REDIS_URL == "redis://localhost:6379"
    assert settings.HOST == "0.0.0.0"  # Default value
    assert settings.PORT == 8000  # Default value
    assert settings.LOG_LEVEL == "info"  # Default value


def test_settings_with_ollama_backend(monkeypatch):
    """Test settings load correctly with Ollama backend."""
    monkeypatch.setenv("MODEL_BACKEND", "ollama")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "b" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    settings = Settings()
    
    assert settings.MODEL_BACKEND == "ollama"
    assert settings.OLLAMA_BASE_URL == "http://localhost:11434"


def test_settings_with_custom_values(monkeypatch):
    """Test settings with custom server configuration."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "https://api.derlg.com")
    monkeypatch.setenv("AI_SERVICE_KEY", "c" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://redis:6379")
    monkeypatch.setenv("HOST", "127.0.0.1")
    monkeypatch.setenv("PORT", "9000")
    monkeypatch.setenv("LOG_LEVEL", "debug")
    monkeypatch.setenv("SENTRY_DSN", "https://sentry.io/test")
    
    settings = Settings()
    
    assert settings.HOST == "127.0.0.1"
    assert settings.PORT == 9000
    assert settings.LOG_LEVEL == "debug"
    assert settings.SENTRY_DSN == "https://sentry.io/test"


def test_missing_model_backend(monkeypatch):
    """Test that missing MODEL_BACKEND raises validation error."""
    monkeypatch.delenv("MODEL_BACKEND", raising=False)
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "d" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    assert "MODEL_BACKEND" in str(exc_info.value)
    assert "Field required" in str(exc_info.value)


def test_missing_anthropic_key_when_backend_is_anthropic(monkeypatch):
    """Test that missing ANTHROPIC_API_KEY raises error when MODEL_BACKEND=anthropic."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "e" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error_message = str(exc_info.value)
    assert "ANTHROPIC_API_KEY is required when MODEL_BACKEND=anthropic" in error_message


def test_missing_ollama_url_when_backend_is_ollama(monkeypatch):
    """Test that missing OLLAMA_BASE_URL raises error when MODEL_BACKEND=ollama."""
    monkeypatch.setenv("MODEL_BACKEND", "ollama")
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "f" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error_message = str(exc_info.value)
    assert "OLLAMA_BASE_URL is required when MODEL_BACKEND=ollama" in error_message


def test_missing_backend_url(monkeypatch):
    """Test that missing BACKEND_URL raises validation error."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.delenv("BACKEND_URL", raising=False)
    monkeypatch.setenv("AI_SERVICE_KEY", "g" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    assert "BACKEND_URL" in str(exc_info.value)


def test_missing_ai_service_key(monkeypatch):
    """Test that missing AI_SERVICE_KEY raises validation error."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.delenv("AI_SERVICE_KEY", raising=False)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    assert "AI_SERVICE_KEY" in str(exc_info.value)


def test_ai_service_key_too_short(monkeypatch):
    """Test that AI_SERVICE_KEY shorter than 32 characters raises error."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "short-key")  # Only 9 characters
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error_message = str(exc_info.value)
    assert "at least 32 characters" in error_message


def test_ai_service_key_placeholder_value(monkeypatch):
    """Test that placeholder AI_SERVICE_KEY values are rejected."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "your-secure-32-character-minimum-key-here-change-this")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error_message = str(exc_info.value)
    assert "placeholder value" in error_message


def test_missing_redis_url(monkeypatch):
    """Test that missing REDIS_URL raises validation error."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "h" * 32)
    monkeypatch.delenv("REDIS_URL", raising=False)
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    assert "REDIS_URL" in str(exc_info.value)


def test_invalid_log_level(monkeypatch):
    """Test that invalid LOG_LEVEL raises validation error."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "i" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    monkeypatch.setenv("LOG_LEVEL", "invalid")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error_message = str(exc_info.value)
    assert "LOG_LEVEL must be one of" in error_message


def test_backend_url_trailing_slash_removed(monkeypatch):
    """Test that trailing slash is removed from BACKEND_URL."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001/")  # With trailing slash
    monkeypatch.setenv("AI_SERVICE_KEY", "j" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    settings = Settings()
    
    # Trailing slash should be removed
    assert settings.BACKEND_URL == "http://localhost:3001"


def test_log_level_case_insensitive(monkeypatch):
    """Test that LOG_LEVEL is case-insensitive."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "k" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")  # Uppercase
    
    settings = Settings()
    
    # Should be converted to lowercase
    assert settings.LOG_LEVEL == "debug"


def test_invalid_model_backend(monkeypatch):
    """Test that invalid MODEL_BACKEND value raises validation error."""
    monkeypatch.setenv("MODEL_BACKEND", "invalid")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "l" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error_message = str(exc_info.value)
    assert "MODEL_BACKEND" in error_message


def test_port_validation(monkeypatch):
    """Test that PORT is validated to be within valid range."""
    monkeypatch.setenv("MODEL_BACKEND", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    monkeypatch.setenv("BACKEND_URL", "http://localhost:3001")
    monkeypatch.setenv("AI_SERVICE_KEY", "m" * 32)
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
    monkeypatch.setenv("PORT", "99999")  # Invalid port
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error_message = str(exc_info.value)
    assert "PORT" in error_message or "less than or equal to 65535" in error_message


def test_env_file_loading(tmp_path, monkeypatch):
    """Test that settings can load from .env file."""
    # Remove env vars that would take precedence over .env file
    monkeypatch.delenv("MODEL_BACKEND", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_BASE_URL", raising=False)
    monkeypatch.delenv("BACKEND_URL", raising=False)
    monkeypatch.delenv("AI_SERVICE_KEY", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)
    monkeypatch.delenv("LOG_LEVEL", raising=False)

    # Create a temporary .env file
    env_file = tmp_path / ".env"
    env_file.write_text("""
MODEL_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-test-key-from-file
BACKEND_URL=http://localhost:3001
AI_SERVICE_KEY=nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
""")

    # Change to temp directory
    monkeypatch.chdir(tmp_path)

    settings = Settings()

    assert settings.MODEL_BACKEND == "anthropic"
    assert settings.ANTHROPIC_API_KEY == "sk-ant-test-key-from-file"
    assert settings.LOG_LEVEL == "debug"


def test_startup_validation_with_valid_config(monkeypatch, tmp_path):
    """Test that main.py successfully loads with valid configuration."""
    # Remove env vars that would take precedence over .env file
    monkeypatch.delenv("MODEL_BACKEND", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_BASE_URL", raising=False)
    monkeypatch.delenv("BACKEND_URL", raising=False)
    monkeypatch.delenv("AI_SERVICE_KEY", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)

    # Create a temporary .env file with valid configuration
    env_file = tmp_path / ".env"
    env_file.write_text("""
MODEL_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-test-key-valid
BACKEND_URL=http://localhost:3001
AI_SERVICE_KEY=oooooooooooooooooooooooooooooooo
REDIS_URL=redis://localhost:6379
""")

    # Change to temp directory
    monkeypatch.chdir(tmp_path)

    # This should not raise any exceptions
    settings = Settings()

    assert settings.MODEL_BACKEND == "anthropic"
    assert settings.ANTHROPIC_API_KEY == "sk-ant-test-key-valid"


def test_startup_validation_fails_with_missing_required_field(monkeypatch, tmp_path):
    """Test that startup validation catches missing required fields."""
    # Remove env vars that would take precedence over .env file
    monkeypatch.delenv("MODEL_BACKEND", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_BASE_URL", raising=False)
    monkeypatch.delenv("BACKEND_URL", raising=False)
    monkeypatch.delenv("AI_SERVICE_KEY", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)

    # Create a temporary .env file missing MODEL_BACKEND
    env_file = tmp_path / ".env"
    env_file.write_text("""
ANTHROPIC_API_KEY=sk-ant-test-key
BACKEND_URL=http://localhost:3001
AI_SERVICE_KEY=pppppppppppppppppppppppppppppppp
REDIS_URL=redis://localhost:6379
""")
    
    monkeypatch.chdir(tmp_path)
    
    # Should raise ValidationError
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    assert "MODEL_BACKEND" in str(exc_info.value)


def test_startup_validation_fails_with_invalid_service_key(monkeypatch, tmp_path):
    """Test that startup validation catches invalid AI_SERVICE_KEY."""
    # Remove env vars that would take precedence over .env file
    monkeypatch.delenv("MODEL_BACKEND", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_BASE_URL", raising=False)
    monkeypatch.delenv("BACKEND_URL", raising=False)
    monkeypatch.delenv("AI_SERVICE_KEY", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)

    env_file = tmp_path / ".env"
    env_file.write_text("""
MODEL_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-test-key
BACKEND_URL=http://localhost:3001
AI_SERVICE_KEY=too-short
REDIS_URL=redis://localhost:6379
""")
    
    monkeypatch.chdir(tmp_path)
    
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    
    error_message = str(exc_info.value)
    assert "at least 32 characters" in error_message
