"""
Model client implementations for LLM backends.

This package provides a backend-agnostic interface for interacting with LLMs.
Use ``get_model_client`` to obtain the correct client based on application
settings and user language preference.

Usage:
    from agent.models import get_model_client, ModelClient

    client: ModelClient = get_model_client(preferred_language="EN")
    response = await client.create_message(system="...", messages=[...], tools=[...])
"""

from agent.models.client import ContentBlock, ModelClient, ModelResponse
from agent.models.anthropic import AnthropicClient
from agent.models.ollama import OllamaClient
from agent.models.nvidia import NvidiaClient
from config.settings import settings


def get_model_client(preferred_language: str = "EN") -> ModelClient:
    """Create the appropriate ModelClient based on settings and language.

    Khmer (KH) conversations prefer Anthropic for best Khmer language
    support, but fall back to the configured backend if ANTHROPIC_API_KEY
    is not available.

    Args:
        preferred_language: ISO language code ("EN", "KH", or "ZH").

    Returns:
        A concrete ModelClient instance ready for use.

    Raises:
        ValueError: If ``settings.MODEL_BACKEND`` is not a recognized value.
    """
    if preferred_language == "KH" and settings.ANTHROPIC_API_KEY:
        return AnthropicClient()

    if settings.MODEL_BACKEND == "anthropic":
        return AnthropicClient()
    elif settings.MODEL_BACKEND == "ollama":
        return OllamaClient()
    elif settings.MODEL_BACKEND == "nvidia":
        return NvidiaClient()
    else:
        raise ValueError(f"Unknown MODEL_BACKEND: {settings.MODEL_BACKEND}")


__all__ = [
    "ContentBlock",
    "ModelClient",
    "ModelResponse",
    "AnthropicClient",
    "OllamaClient",
    "NvidiaClient",
    "get_model_client",
]
