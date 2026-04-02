"""Tool execution engine for the DerLg AI agent.

ToolExecutor is responsible for:
1. Receiving tool_use blocks from the Anthropic Claude response.
2. Dispatching each tool call to the correct handler via TOOL_DISPATCH.
3. Running independent tool calls in parallel with asyncio.gather.
4. Returning tool_result blocks in the Anthropic message format.

Connection pooling:
    A module-level ``httpx.AsyncClient`` is reused across all tool
    executions within the same event loop, avoiding the overhead of
    opening and closing TCP connections on every tool call.  The pool
    is initialized lazily on first use and closed via ``close_http_pool``.

Usage::

    from agent.tools.executor import ToolExecutor

    executor = ToolExecutor()
    results = await executor.execute_tools_parallel(tool_calls, session_language="EN")
    # results is a list of {"type": "tool_result", "tool_use_id": ..., "content": ...}
"""

import asyncio
import json
from typing import Any

import httpx
import structlog

from agent.tools.handlers import TOOL_DISPATCH
from config.settings import settings
from utils.circuit_breaker import CircuitBreaker
from utils.sanitizer import validate_tool_input

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

TOOL_TIMEOUT_SECONDS = 15

# Connection pool limits for the shared httpx client.
MAX_CONNECTIONS = 20
MAX_KEEPALIVE_CONNECTIONS = 10

# Single circuit breaker instance shared across all tool executions.
# Opens after 5 consecutive backend failures; probes again after 30 s.
circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30)

# Module-level connection-pooled HTTP client, initialized lazily.
_http_client: httpx.AsyncClient | None = None


def _get_http_client(timeout: float) -> httpx.AsyncClient:
    """Return the shared, connection-pooled HTTP client.

    Creates the client on first call.  Subsequent calls return the same
    instance so TCP connections are reused across tool executions.
    """
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(
                max_connections=MAX_CONNECTIONS,
                max_keepalive_connections=MAX_KEEPALIVE_CONNECTIONS,
            ),
        )
        logger.info(
            "http_pool_initialized",
            max_connections=MAX_CONNECTIONS,
            max_keepalive=MAX_KEEPALIVE_CONNECTIONS,
            timeout=timeout,
        )
    return _http_client


async def close_http_pool() -> None:
    """Close the shared HTTP client pool gracefully.

    Should be called during application shutdown (e.g. in the
    FastAPI lifespan handler).
    """
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None
        logger.info("http_pool_closed")


class ToolExecutor:
    """Executes tool calls against the NestJS backend and returns Anthropic-formatted results."""

    def __init__(self) -> None:
        self._backend_url: str = settings.BACKEND_URL
        self._service_key: str = settings.AI_SERVICE_KEY
        self._timeout: float = TOOL_TIMEOUT_SECONDS

    async def execute_tools_parallel(
        self,
        tool_calls: list[dict[str, Any]],
        session_language: str,
    ) -> list[dict[str, Any]]:
        """Execute multiple tool calls concurrently and collect results.

        Args:
            tool_calls: List of Anthropic tool_use content blocks, each containing
                        ``id``, ``name``, and ``input`` keys.
            session_language: Language code for Accept-Language header (EN, KH, ZH).

        Returns:
            List of tool_result dicts in Anthropic message format::

                [
                    {
                        "type": "tool_result",
                        "tool_use_id": "<tool-use-id>",
                        "content": "<json-string-of-result>"
                    },
                    ...
                ]
        """
        if not tool_calls:
            return []

        logger.info(
            "tool_execution_started",
            tool_count=len(tool_calls),
            tool_names=[tc.get("name") for tc in tool_calls],
            language=session_language,
        )

        tasks = [
            self._execute_single_tool(
                tool_id=tc["id"],
                tool_name=tc["name"],
                tool_input=tc.get("input", {}),
                session_language=session_language,
            )
            for tc in tool_calls
        ]

        results: list[dict[str, Any]] = await asyncio.gather(*tasks)

        logger.info(
            "tool_execution_completed",
            tool_count=len(results),
        )

        return results

    async def _execute_single_tool(
        self,
        tool_id: str,
        tool_name: str,
        tool_input: dict[str, Any],
        session_language: str,
    ) -> dict[str, Any]:
        """Execute one tool call and return an Anthropic tool_result block.

        Args:
            tool_id: Unique identifier from the tool_use block.
            tool_name: Name of the tool to execute (must exist in TOOL_DISPATCH).
            tool_input: Keyword arguments parsed from the model output.
            session_language: Language code for the Accept-Language header.

        Returns:
            Dict formatted as an Anthropic tool_result content block.
        """
        handler = TOOL_DISPATCH.get(tool_name)

        if handler is None:
            logger.error("tool_not_found", tool_name=tool_name, tool_id=tool_id)
            return {
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": json.dumps({"error": f"Unknown tool: {tool_name}"}),
                "is_error": True,
            }

        # --- Circuit breaker guard -------------------------------------------
        if not circuit_breaker.can_execute():
            return {
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": json.dumps({
                    "error": (
                        "Our backend services are temporarily unavailable. "
                        "Please try again in a few moments."
                    ),
                }),
                "is_error": True,
            }

        # Sanitize tool inputs before calling the handler
        tool_input = validate_tool_input(tool_name, tool_input)

        try:
            client = _get_http_client(self._timeout)
            result = await handler(
                client=client,
                backend_url=self._backend_url,
                service_key=self._service_key,
                language=session_language,
                **tool_input,
            )

            circuit_breaker.record_success()

            logger.info(
                "tool_executed",
                tool_name=tool_name,
                tool_id=tool_id,
                success=True,
            )

            return {
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": json.dumps(result),
            }

        except httpx.TimeoutException:
            circuit_breaker.record_failure()
            logger.error(
                "tool_timeout",
                tool_name=tool_name,
                tool_id=tool_id,
                timeout_seconds=self._timeout,
            )
            return {
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": json.dumps({
                    "error": f"Tool '{tool_name}' timed out after {self._timeout}s",
                }),
                "is_error": True,
            }

        except httpx.HTTPStatusError as exc:
            circuit_breaker.record_failure()
            status_code = exc.response.status_code
            logger.error(
                "tool_http_error",
                tool_name=tool_name,
                tool_id=tool_id,
                status_code=status_code,
                response_body=exc.response.text[:500],
            )
            return {
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": json.dumps({
                    "error": f"Backend returned HTTP {status_code} for tool '{tool_name}'",
                    "status_code": status_code,
                }),
                "is_error": True,
            }

        except Exception as exc:
            circuit_breaker.record_failure()
            logger.error(
                "tool_unexpected_error",
                tool_name=tool_name,
                tool_id=tool_id,
                error_type=type(exc).__name__,
                error_message=str(exc),
                exc_info=True,
            )
            return {
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": json.dumps({
                    "error": f"Unexpected error in tool '{tool_name}': {type(exc).__name__}",
                }),
                "is_error": True,
            }
