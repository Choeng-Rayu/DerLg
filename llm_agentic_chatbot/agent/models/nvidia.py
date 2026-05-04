"""
NVIDIA Model Client for DerLg.com AI Agent

Concrete ModelClient implementation that calls the NVIDIA API via the
OpenAI-compatible endpoint at ``https://integrate.api.nvidia.com/v1``.

The client uses the official ``openai`` Python SDK with a custom base_url
to communicate with NVIDIA's hosted models. Includes:
- Automatic retry on transient API errors (once, with 1-second backoff)
- Structured logging of token usage and latency via structlog
- 60-second client-level timeout
- Tool calling support via OpenAI function-calling format

Usage:
    client = NvidiaClient()
    response = await client.create_message(
        system="You are a travel assistant.",
        messages=[{"role": "user", "content": "Suggest a trip"}],
        tools=[...],
    )
"""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any

import structlog
from openai import AsyncOpenAI, APIError

from agent.models.client import ContentBlock, ModelClient, ModelResponse
from config.settings import settings

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
TEMPERATURE = 0.7
MAX_RETRIES = 1
RETRY_DELAY_SECONDS = 1.0
CLIENT_TIMEOUT = 60.0
MAX_TOKENS_DEFAULT = 2048

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


class NvidiaClient(ModelClient):
    """ModelClient backed by the NVIDIA API (OpenAI-compatible).

    Initializes an ``AsyncOpenAI`` client pointed at NVIDIA's hosted
    endpoint with the user's NVIDIA API key.
    """

    def __init__(self) -> None:
        self.model: str = settings.LLM_MODEL_SELECTED or "openai/gpt-oss-120b"
        self.client = AsyncOpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=settings.NVIDIA_API_KEY,
            timeout=CLIENT_TIMEOUT,
        )

    async def create_message(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        max_tokens: int = MAX_TOKENS_DEFAULT,
    ) -> ModelResponse:
        """Send a message to the NVIDIA API and return a normalized response.

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
            APIError: If the request fails after all retries.
        """
        openai_messages = self._build_openai_messages(system, messages)
        openai_tools = self._convert_tools_to_openai(tools)

        last_error: Exception | None = None

        for attempt in range(1 + MAX_RETRIES):
            try:
                start = time.monotonic()

                kwargs: dict[str, Any] = {
                    "model": self.model,
                    "messages": openai_messages,
                    "max_tokens": max_tokens,
                    "temperature": TEMPERATURE,
                }
                if openai_tools:
                    kwargs["tools"] = openai_tools

                response = await self.client.chat.completions.create(**kwargs)
                latency_ms = (time.monotonic() - start) * 1000

                # Log usage
                usage = response.usage
                logger.info(
                    "nvidia_api_call",
                    model=self.model,
                    input_tokens=usage.prompt_tokens if usage else 0,
                    output_tokens=usage.completion_tokens if usage else 0,
                    latency_ms=round(latency_ms, 1),
                    stop_reason=response.choices[0].finish_reason if response.choices else "unknown",
                    attempt=attempt + 1,
                )

                return self._to_model_response(response)

            except APIError as exc:
                last_error = exc
                logger.warning(
                    "nvidia_api_error",
                    error=str(exc),
                    attempt=attempt + 1,
                    will_retry=attempt < MAX_RETRIES,
                )
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY_SECONDS)

        raise last_error  # type: ignore[misc]

    @staticmethod
    def _build_openai_messages(
        system: str,
        messages: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Convert Anthropic-format messages to OpenAI chat format.

        Anthropic messages use content blocks (list of dicts), while OpenAI
        expects a simple string or structured content. This method handles
        the conversion, including tool_result messages.

        Args:
            system: The system prompt string.
            messages: Conversation messages in Anthropic format.

        Returns:
            Messages list in OpenAI chat format with system message prepended.
        """
        openai_messages: list[dict[str, Any]] = [
            {"role": "system", "content": system},
        ]

        for msg in messages:
            role = msg["role"]
            content = msg.get("content", "")

            if isinstance(content, str):
                openai_messages.append({"role": role, "content": content})
                continue

            if isinstance(content, list):
                # Handle Anthropic content blocks
                text_parts: list[str] = []
                tool_use_blocks: list[dict[str, Any]] = []
                tool_result_blocks: list[dict[str, Any]] = []

                for block in content:
                    if not isinstance(block, dict):
                        continue

                    block_type = block.get("type", "")

                    if block_type == "text":
                        text_parts.append(block.get("text", ""))
                    elif block_type == "tool_use":
                        tool_use_blocks.append(block)
                    elif block_type == "tool_result":
                        tool_result_blocks.append(block)

                # Assistant message with tool calls
                if role == "assistant" and tool_use_blocks:
                    assistant_msg: dict[str, Any] = {
                        "role": "assistant",
                        "content": "\n".join(text_parts) if text_parts else None,
                        "tool_calls": [
                            {
                                "id": tc["id"],
                                "type": "function",
                                "function": {
                                    "name": tc["name"],
                                    "arguments": json.dumps(tc.get("input", {})),
                                },
                            }
                            for tc in tool_use_blocks
                        ],
                    }
                    openai_messages.append(assistant_msg)

                # Tool result messages (Anthropic sends as user role)
                elif tool_result_blocks:
                    for tr in tool_result_blocks:
                        tool_content = tr.get("content", "")
                        if isinstance(tool_content, dict):
                            tool_content = json.dumps(tool_content)
                        openai_messages.append({
                            "role": "tool",
                            "tool_call_id": tr.get("tool_use_id", ""),
                            "content": tool_content,
                        })

                # Regular text message
                elif text_parts:
                    openai_messages.append({
                        "role": role,
                        "content": "\n".join(text_parts),
                    })

        return openai_messages

    @staticmethod
    def _convert_tools_to_openai(
        anthropic_tools: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Convert Anthropic tool definitions to OpenAI function-calling format.

        Args:
            anthropic_tools: Tool list in Anthropic format.

        Returns:
            Tool list in OpenAI function-calling format.
        """
        openai_tools: list[dict[str, Any]] = []
        for tool in anthropic_tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool.get("description", ""),
                    "parameters": tool.get("input_schema", {}),
                },
            })
        return openai_tools

    @staticmethod
    def _to_model_response(response: Any) -> ModelResponse:
        """Convert an OpenAI ChatCompletion response into a normalized ModelResponse.

        Handles both plain text replies and tool-call responses.

        Args:
            response: Response from the OpenAI SDK.

        Returns:
            A ModelResponse with the same semantic content.
        """
        if not response.choices:
            return ModelResponse(stop_reason="unknown", content=[])

        choice = response.choices[0]
        message = choice.message
        finish_reason = choice.finish_reason or "stop"
        blocks: list[ContentBlock] = []

        # Check for tool calls
        if message.tool_calls:
            # Include any text content before tool calls
            if message.content:
                blocks.append(ContentBlock(type="text", text=message.content))

            for tc in message.tool_calls:
                # Parse arguments from JSON string
                try:
                    args = json.loads(tc.function.arguments) if tc.function.arguments else {}
                except (json.JSONDecodeError, TypeError):
                    args = {}

                blocks.append(
                    ContentBlock(
                        type="tool_use",
                        id=tc.id,
                        name=tc.function.name,
                        input=args,
                    )
                )
            stop_reason = "tool_use"
        else:
            text = message.content or ""
            blocks.append(ContentBlock(type="text", text=text))
            stop_reason = "end_turn"

        return ModelResponse(stop_reason=stop_reason, content=blocks)
