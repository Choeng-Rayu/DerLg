"""
Abstract Model Client Interface for DerLg.com AI Agent

This module defines the abstract interface that all LLM backend clients must
implement. It enables seamless swapping between Anthropic Claude and local
Ollama models without changing any calling code.

The interface uses Anthropic's message format as the canonical representation:
- System prompts as strings
- Messages as list[dict] with "role" and "content" keys
- Tools in Anthropic's tool format
- Responses normalized into ContentBlock / ModelResponse dataclasses

Usage:
    from agent.models import get_model_client

    client = get_model_client(preferred_language="EN")
    response = await client.create_message(
        system="You are a helpful assistant.",
        messages=[{"role": "user", "content": "Hello"}],
        tools=[],
    )
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True, slots=True)
class ContentBlock:
    """A single block within a model response.

    Represents either a text block or a tool_use block returned by the LLM.

    Attributes:
        type: Block type - "text" for natural language, "tool_use" for tool calls.
        text: The text content. Present when type is "text", None otherwise.
        id: Tool use ID assigned by the model. Present when type is "tool_use".
        name: Tool name the model wants to call. Present when type is "tool_use".
        input: Tool input arguments as a dictionary. Present when type is "tool_use".
    """

    type: str
    text: str | None = None
    id: str | None = None
    name: str | None = None
    input: dict[str, Any] | None = None


@dataclass(frozen=True, slots=True)
class ModelResponse:
    """Normalized response from any LLM backend.

    Wraps the raw provider response into a consistent shape so that
    downstream code (LangGraph nodes, tool dispatcher) never depends
    on provider-specific classes.

    Attributes:
        stop_reason: Why the model stopped generating. Common values:
            "end_turn" - natural completion, "tool_use" - wants to call a tool,
            "max_tokens" - hit the token limit.
        content: Ordered list of ContentBlock items the model produced.
    """

    stop_reason: str
    content: list[ContentBlock] = field(default_factory=list)


class ModelClient(ABC):
    """Abstract base class for LLM backend clients.

    Every concrete client (Anthropic, Ollama, etc.) must implement
    ``create_message`` with the same signature so that the rest of
    the agent code is backend-agnostic.
    """

    @abstractmethod
    async def create_message(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        max_tokens: int = 2048,
    ) -> ModelResponse:
        """Send a chat completion request to the LLM backend.

        Args:
            system: The system prompt providing agent personality and rules.
            messages: Conversation history in Anthropic message format
                (list of dicts with "role" and "content" keys).
            tools: Tool definitions in Anthropic tool format.
            max_tokens: Maximum tokens the model may generate.

        Returns:
            A normalized ModelResponse containing the model's output.

        Raises:
            Exception: Backend-specific errors (rate limits, timeouts, etc.)
                are logged and may be retried by the concrete implementation.
        """
