"""
Ollama (Local LLM) Model Client for DerLg.com AI Agent

Concrete ModelClient implementation that calls a local Ollama server via its
REST API. Useful for development and testing without consuming Anthropic
API credits. The client:
- Converts Anthropic-format tool definitions to OpenAI function-calling format
- Sends requests to the ``/api/chat`` endpoint
- Normalizes responses back into the canonical ModelResponse shape
- Logs latency and model info via structlog

Usage:
    client = OllamaClient()
    response = await client.create_message(
        system="You are a travel assistant.",
        messages=[{"role": "user", "content": "Hello"}],
        tools=[...],
    )
"""

from __future__ import annotations

import time
from typing import Any

import httpx
import structlog

from agent.models.client import ContentBlock, ModelClient, ModelResponse
from config.settings import settings

MODEL_ID = "llama3.1:8b"
CLIENT_TIMEOUT = 60.0

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


class OllamaClient(ModelClient):
    """ModelClient backed by a local Ollama server.

    Communicates with Ollama's ``/api/chat`` REST endpoint. Tool definitions
    are translated from Anthropic format to the OpenAI function-calling
    format that Ollama understands.
    """

    def __init__(self) -> None:
        self.base_url: str = (settings.OLLAMA_BASE_URL or "").rstrip("/")
        self.http = httpx.AsyncClient(timeout=CLIENT_TIMEOUT)

    async def create_message(
        self,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        max_tokens: int = 2048,
    ) -> ModelResponse:
        """Send a chat request to Ollama and return a normalized response.

        Args:
            system: System prompt for the model.
            messages: Conversation history in Anthropic message format.
            tools: Tool definitions in Anthropic tool format.
            max_tokens: Maximum tokens the model may generate (passed as num_predict).

        Returns:
            Normalized ModelResponse.

        Raises:
            httpx.HTTPStatusError: If the Ollama server returns a non-2xx status.
        """
        ollama_messages = self._build_ollama_messages(system, messages)
        ollama_tools = self._convert_tools_to_openai(tools)

        payload: dict[str, Any] = {
            "model": MODEL_ID,
            "messages": ollama_messages,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
            },
        }
        if ollama_tools:
            payload["tools"] = ollama_tools

        start = time.monotonic()
        response = await self.http.post(
            f"{self.base_url}/api/chat",
            json=payload,
        )
        response.raise_for_status()
        latency_ms = (time.monotonic() - start) * 1000

        data = response.json()

        logger.info(
            "ollama_api_call",
            model=MODEL_ID,
            latency_ms=round(latency_ms, 1),
            has_tool_calls=bool(data.get("message", {}).get("tool_calls")),
        )

        return self._to_model_response(data)

    @staticmethod
    def _build_ollama_messages(
        system: str,
        messages: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Prepend a system message and pass through the rest.

        Ollama expects the system prompt as the first message in the list
        with ``role: "system"``.

        Args:
            system: The system prompt string.
            messages: Conversation messages in Anthropic format.

        Returns:
            Messages list in Ollama/OpenAI chat format.
        """
        ollama_messages: list[dict[str, Any]] = [
            {"role": "system", "content": system},
        ]
        for msg in messages:
            ollama_messages.append({
                "role": msg["role"],
                "content": msg.get("content", ""),
            })
        return ollama_messages

    @staticmethod
    def _convert_tools_to_openai(
        anthropic_tools: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Convert Anthropic tool definitions to OpenAI function-calling format.

        Anthropic format::

            {
                "name": "get_weather",
                "description": "Get weather for a city",
                "input_schema": { "type": "object", "properties": {...} }
            }

        OpenAI / Ollama format::

            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "Get weather for a city",
                    "parameters": { "type": "object", "properties": {...} }
                }
            }

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
    def _to_model_response(data: dict[str, Any]) -> ModelResponse:
        """Convert a raw Ollama JSON response into a normalized ModelResponse.

        Handles both plain text replies and tool-call responses.

        Args:
            data: Parsed JSON body from the Ollama ``/api/chat`` endpoint.

        Returns:
            A ModelResponse with the same semantic content.
        """
        message = data.get("message", {})
        tool_calls: list[dict[str, Any]] = message.get("tool_calls", [])
        blocks: list[ContentBlock] = []

        if tool_calls:
            for idx, tc in enumerate(tool_calls):
                fn = tc.get("function", {})
                blocks.append(
                    ContentBlock(
                        type="tool_use",
                        id=f"ollama_tool_{idx}",
                        name=fn.get("name", ""),
                        input=fn.get("arguments", {}),
                    )
                )
            stop_reason = "tool_use"
        else:
            text = message.get("content", "")
            blocks.append(ContentBlock(type="text", text=text))
            stop_reason = "end_turn"

        return ModelResponse(stop_reason=stop_reason, content=blocks)
