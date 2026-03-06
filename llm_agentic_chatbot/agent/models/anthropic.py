"""
Anthropic (Claude) Model Client for DerLg.com AI Agent

Concrete ModelClient implementation that calls the Anthropic Messages API
using the official ``anthropic`` Python SDK. Includes:
- Automatic retry on transient API errors (once, with 1-second backoff)
- Structured logging of token usage and latency via structlog
- 60-second client-level timeout

Usage:
    client = AnthropicClient()
    response = await client.create_message(
        system="You are a travel assistant.",
        messages=[{"role": "user", "content": "Suggest a trip"}],
        tools=[...],
    )
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

import anthropic
import structlog

from agent.models.client import ContentBlock, ModelClient, ModelResponse
from config.settings import settings

MODEL_ID = "claude-sonnet-4-5-20251022"
TEMPERATURE = 0.7
MAX_RETRIES = 1
RETRY_DELAY_SECONDS = 1.0
CLIENT_TIMEOUT = 60.0

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


class AnthropicClient(ModelClient):
    """ModelClient backed by the Anthropic Messages API.

    Initializes an ``AsyncAnthropic`` client with the API key from
    application settings and a 60-second timeout.
    """

    def __init__(self) -> None:
        self.client = anthropic.AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            timeout=CLIENT_TIMEOUT,
        )

    async def create_message(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        max_tokens: int = 2048,
    ) -> ModelResponse:
        """Send a message to the Anthropic API and return a normalized response.

        On transient API errors the call is retried once after a 1-second delay.
        Token usage and latency are logged on every successful call.

        Args:
            system: System prompt for the model.
            messages: Conversation history in Anthropic message format.
            tools: Tool definitions in Anthropic tool format.
            max_tokens: Maximum tokens the model may generate.

        Returns:
            Normalized ModelResponse.

        Raises:
            anthropic.APIError: If the request fails after all retries.
        """
        last_error: Exception | None = None

        for attempt in range(1 + MAX_RETRIES):
            try:
                start = time.monotonic()
                response = await self.client.messages.create(
                    model=MODEL_ID,
                    system=system,
                    messages=messages,
                    tools=tools,
                    max_tokens=max_tokens,
                    temperature=TEMPERATURE,
                )
                latency_ms = (time.monotonic() - start) * 1000

                logger.info(
                    "anthropic_api_call",
                    model=MODEL_ID,
                    input_tokens=response.usage.input_tokens,
                    output_tokens=response.usage.output_tokens,
                    latency_ms=round(latency_ms, 1),
                    stop_reason=response.stop_reason,
                    attempt=attempt + 1,
                )

                return self._to_model_response(response)

            except anthropic.APIError as exc:
                last_error = exc
                logger.warning(
                    "anthropic_api_error",
                    error=str(exc),
                    attempt=attempt + 1,
                    will_retry=attempt < MAX_RETRIES,
                )
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY_SECONDS)

        raise last_error  # type: ignore[misc]

    @staticmethod
    def _to_model_response(response: anthropic.types.Message) -> ModelResponse:
        """Convert a raw Anthropic Message into a normalized ModelResponse.

        Handles both ``text`` and ``tool_use`` content blocks.

        Args:
            response: Raw response from the Anthropic SDK.

        Returns:
            A ModelResponse with the same semantic content.
        """
        blocks: list[ContentBlock] = []

        for block in response.content:
            if block.type == "text":
                blocks.append(ContentBlock(type="text", text=block.text))
            elif block.type == "tool_use":
                blocks.append(
                    ContentBlock(
                        type="tool_use",
                        id=block.id,
                        name=block.name,
                        input=block.input,
                    )
                )

        return ModelResponse(
            stop_reason=response.stop_reason or "unknown",
            content=blocks,
        )
