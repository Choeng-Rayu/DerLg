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
from config.settings import settings


def get_model_client(preferred_language: str = "EN") -> ModelClient:
    """Create the appropriate ModelClient based on settings and language.

    Khmer (KH) conversations always use Anthropic because local Ollama
    models lack adequate Khmer language support.

    Args:
        preferred_language: ISO language code ("EN", "KH", or "ZH").

    Returns:
        A concrete ModelClient instance ready for use.

    Raises:
        ValueError: If ``settings.MODEL_BACKEND`` is not a recognized value.
    """
    if preferred_language == "KH":
        return AnthropicClient()

    if settings.MODEL_BACKEND == "anthropic":
        return AnthropicClient()
    elif settings.MODEL_BACKEND == "ollama":
        return OllamaClient()
    else:
        raise ValueError(f"Unknown MODEL_BACKEND: {settings.MODEL_BACKEND}")


__all__ = [
    "ContentBlock",
    "ModelClient",
    "ModelResponse",
    "AnthropicClient",
    "OllamaClient",
    "get_model_client",
]
