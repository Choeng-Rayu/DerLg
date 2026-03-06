"""Unit tests for ToolExecutor (parallel tool execution engine)."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

import httpx
from agent.tools.executor import ToolExecutor, TOOL_TIMEOUT_SECONDS


@pytest.fixture
def mock_settings():
    s = MagicMock()
    s.BACKEND_URL = "http://localhost:3001"
    s.AI_SERVICE_KEY = "a" * 32
    return s


@pytest.fixture
def executor(mock_settings):
    with patch("agent.tools.executor.settings", mock_settings):
        return ToolExecutor()


class TestExecuteToolsParallel:

    @pytest.mark.asyncio
    async def test_empty_tool_calls_returns_empty(self, executor):
        results = await executor.execute_tools_parallel([], "EN")
        assert results == []

    @pytest.mark.asyncio
    async def test_unknown_tool_returns_error(self, executor):
        tool_calls = [{"id": "tu_1", "name": "nonExistentTool", "input": {}}]
        results = await executor.execute_tools_parallel(tool_calls, "EN")
        assert len(results) == 1
        assert results[0]["is_error"] is True
        content = json.loads(results[0]["content"])
        assert "Unknown tool" in content["error"]

    @pytest.mark.asyncio
    async def test_successful_tool_execution(self, executor):
        mock_handler = AsyncMock(return_value={"data": {"trips": []}})
        dispatch = {"getTripSuggestions": mock_handler}

        with patch("agent.tools.executor.TOOL_DISPATCH", dispatch):
            tool_calls = [
                {"id": "tu_1", "name": "getTripSuggestions", "input": {"mood": "relaxed"}}
            ]
            results = await executor.execute_tools_parallel(tool_calls, "EN")

        assert len(results) == 1
        assert results[0]["type"] == "tool_result"
        assert results[0]["tool_use_id"] == "tu_1"
        content = json.loads(results[0]["content"])
        assert content["data"]["trips"] == []

    @pytest.mark.asyncio
    async def test_timeout_returns_error(self, executor):
        async def timeout_handler(**kwargs):
            raise httpx.TimeoutException("timed out")

        dispatch = {"getTripSuggestions": timeout_handler}

        with patch("agent.tools.executor.TOOL_DISPATCH", dispatch):
            tool_calls = [{"id": "tu_1", "name": "getTripSuggestions", "input": {}}]
            results = await executor.execute_tools_parallel(tool_calls, "EN")

        assert results[0]["is_error"] is True
        content = json.loads(results[0]["content"])
        assert "timed out" in content["error"]

    @pytest.mark.asyncio
    async def test_http_error_returns_error(self, executor):
        response = MagicMock()
        response.status_code = 500
        response.text = "Internal Server Error"

        async def http_error_handler(**kwargs):
            raise httpx.HTTPStatusError("error", request=MagicMock(), response=response)

        dispatch = {"getTripSuggestions": http_error_handler}

        with patch("agent.tools.executor.TOOL_DISPATCH", dispatch):
            tool_calls = [{"id": "tu_1", "name": "getTripSuggestions", "input": {}}]
            results = await executor.execute_tools_parallel(tool_calls, "EN")

        assert results[0]["is_error"] is True
        content = json.loads(results[0]["content"])
        assert "HTTP 500" in content["error"]

    @pytest.mark.asyncio
    async def test_unexpected_error_returns_error(self, executor):
        async def crash_handler(**kwargs):
            raise RuntimeError("unexpected crash")

        dispatch = {"getTripSuggestions": crash_handler}

        with patch("agent.tools.executor.TOOL_DISPATCH", dispatch):
            tool_calls = [{"id": "tu_1", "name": "getTripSuggestions", "input": {}}]
            results = await executor.execute_tools_parallel(tool_calls, "EN")

        assert results[0]["is_error"] is True
        content = json.loads(results[0]["content"])
        assert "RuntimeError" in content["error"]

    @pytest.mark.asyncio
    async def test_parallel_execution(self, executor):
        """Multiple tools should be dispatched in parallel."""
        call_order = []

        async def handler_a(**kwargs):
            call_order.append("a")
            return {"result": "a"}

        async def handler_b(**kwargs):
            call_order.append("b")
            return {"result": "b"}

        dispatch = {"toolA": handler_a, "toolB": handler_b}

        with patch("agent.tools.executor.TOOL_DISPATCH", dispatch):
            tool_calls = [
                {"id": "tu_1", "name": "toolA", "input": {}},
                {"id": "tu_2", "name": "toolB", "input": {}},
            ]
            results = await executor.execute_tools_parallel(tool_calls, "EN")

        assert len(results) == 2
        assert len(call_order) == 2

    @pytest.mark.asyncio
    async def test_tool_receives_correct_args(self, executor):
        received_kwargs = {}

        async def capture_handler(**kwargs):
            received_kwargs.update(kwargs)
            return {"ok": True}

        dispatch = {"testTool": capture_handler}

        with patch("agent.tools.executor.TOOL_DISPATCH", dispatch):
            tool_calls = [
                {"id": "tu_1", "name": "testTool", "input": {"trip_id": "t1"}}
            ]
            await executor.execute_tools_parallel(tool_calls, "EN")

        assert received_kwargs["trip_id"] == "t1"
        assert received_kwargs["language"] == "EN"
        assert received_kwargs["backend_url"] == "http://localhost:3001"
        assert received_kwargs["service_key"] == "a" * 32

    @pytest.mark.asyncio
    async def test_result_format(self, executor):
        mock_handler = AsyncMock(return_value={"data": "test"})
        dispatch = {"testTool": mock_handler}

        with patch("agent.tools.executor.TOOL_DISPATCH", dispatch):
            tool_calls = [{"id": "tu_42", "name": "testTool", "input": {}}]
            results = await executor.execute_tools_parallel(tool_calls, "EN")

        r = results[0]
        assert r["type"] == "tool_result"
        assert r["tool_use_id"] == "tu_42"
        assert "is_error" not in r
