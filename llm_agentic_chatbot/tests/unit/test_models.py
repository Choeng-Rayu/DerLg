"""Unit tests for model clients (Anthropic, Ollama) and factory function."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from dataclasses import dataclass

from agent.models.client import ContentBlock, ModelClient, ModelResponse
from agent.models.anthropic import AnthropicClient
from agent.models.ollama import OllamaClient


# ===== ContentBlock Tests =====

class TestContentBlock:

    def test_text_block(self):
        block = ContentBlock(type="text", text="Hello")
        assert block.type == "text"
        assert block.text == "Hello"
        assert block.id is None
        assert block.name is None

    def test_tool_use_block(self):
        block = ContentBlock(
            type="tool_use", id="tu_1",
            name="getTripSuggestions", input={"mood": "relaxed"},
        )
        assert block.type == "tool_use"
        assert block.id == "tu_1"
        assert block.name == "getTripSuggestions"
        assert block.input == {"mood": "relaxed"}

    def test_frozen(self):
        block = ContentBlock(type="text", text="Hello")
        with pytest.raises(AttributeError):
            block.text = "Changed"


# ===== ModelResponse Tests =====

class TestModelResponse:

    def test_end_turn_response(self):
        resp = ModelResponse(
            stop_reason="end_turn",
            content=[ContentBlock(type="text", text="Hi")],
        )
        assert resp.stop_reason == "end_turn"
        assert len(resp.content) == 1

    def test_tool_use_response(self):
        resp = ModelResponse(
            stop_reason="tool_use",
            content=[
                ContentBlock(type="text", text="Let me check"),
                ContentBlock(type="tool_use", id="tu_1", name="getWeatherForecast",
                             input={"destination": "Siem Reap"}),
            ],
        )
        assert resp.stop_reason == "tool_use"
        assert len(resp.content) == 2

    def test_empty_content(self):
        resp = ModelResponse(stop_reason="end_turn")
        assert resp.content == []


# ===== AnthropicClient Tests =====

class TestAnthropicClient:

    def test_to_model_response_text(self):
        """Test converting a text-only Anthropic response."""
        mock_block = MagicMock()
        mock_block.type = "text"
        mock_block.text = "Hello there"

        mock_response = MagicMock()
        mock_response.stop_reason = "end_turn"
        mock_response.content = [mock_block]

        result = AnthropicClient._to_model_response(mock_response)
        assert isinstance(result, ModelResponse)
        assert result.stop_reason == "end_turn"
        assert len(result.content) == 1
        assert result.content[0].type == "text"
        assert result.content[0].text == "Hello there"

    def test_to_model_response_tool_use(self):
        """Test converting a tool_use Anthropic response."""
        text_block = MagicMock()
        text_block.type = "text"
        text_block.text = "Let me look that up"

        tool_block = MagicMock()
        tool_block.type = "tool_use"
        tool_block.id = "toolu_123"
        tool_block.name = "getWeatherForecast"
        tool_block.input = {"destination": "Phnom Penh"}

        mock_response = MagicMock()
        mock_response.stop_reason = "tool_use"
        mock_response.content = [text_block, tool_block]

        result = AnthropicClient._to_model_response(mock_response)
        assert result.stop_reason == "tool_use"
        assert len(result.content) == 2
        assert result.content[1].type == "tool_use"
        assert result.content[1].name == "getWeatherForecast"
        assert result.content[1].id == "toolu_123"

    def test_to_model_response_none_stop_reason(self):
        mock_response = MagicMock()
        mock_response.stop_reason = None
        mock_response.content = []

        result = AnthropicClient._to_model_response(mock_response)
        assert result.stop_reason == "unknown"


# ===== OllamaClient Tests =====

class TestOllamaClient:

    def test_build_ollama_messages(self):
        messages = [
            {"role": "user", "content": [{"type": "text", "text": "Hi"}]},
            {"role": "assistant", "content": [{"type": "text", "text": "Hello!"}]},
        ]
        result = OllamaClient._build_ollama_messages("System prompt", messages)

        assert len(result) == 3
        assert result[0]["role"] == "system"
        assert result[0]["content"] == "System prompt"
        assert result[1]["role"] == "user"
        assert result[2]["role"] == "assistant"

    def test_convert_tools_to_openai(self):
        anthropic_tools = [
            {
                "name": "getWeatherForecast",
                "description": "Get weather",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "destination": {"type": "string"},
                    },
                    "required": ["destination"],
                },
            }
        ]
        result = OllamaClient._convert_tools_to_openai(anthropic_tools)

        assert len(result) == 1
        assert result[0]["type"] == "function"
        fn = result[0]["function"]
        assert fn["name"] == "getWeatherForecast"
        assert fn["description"] == "Get weather"
        assert fn["parameters"]["type"] == "object"

    def test_convert_empty_tools(self):
        result = OllamaClient._convert_tools_to_openai([])
        assert result == []

    def test_to_model_response_text(self):
        data = {
            "message": {"content": "Hello from Ollama"},
        }
        result = OllamaClient._to_model_response(data)
        assert result.stop_reason == "end_turn"
        assert len(result.content) == 1
        assert result.content[0].text == "Hello from Ollama"

    def test_to_model_response_tool_calls(self):
        data = {
            "message": {
                "tool_calls": [
                    {
                        "function": {
                            "name": "getWeatherForecast",
                            "arguments": {"destination": "Siem Reap"},
                        }
                    },
                    {
                        "function": {
                            "name": "getPlaces",
                            "arguments": {"category": "TEMPLE"},
                        }
                    },
                ]
            },
        }
        result = OllamaClient._to_model_response(data)
        assert result.stop_reason == "tool_use"
        assert len(result.content) == 2
        assert result.content[0].name == "getWeatherForecast"
        assert result.content[0].id == "ollama_tool_0"
        assert result.content[1].name == "getPlaces"
        assert result.content[1].id == "ollama_tool_1"

    def test_to_model_response_empty_message(self):
        data = {"message": {}}
        result = OllamaClient._to_model_response(data)
        assert result.stop_reason == "end_turn"
        assert len(result.content) == 1
        assert result.content[0].text == ""


# ===== get_model_client Factory Tests =====

class TestGetModelClient:

    def test_khmer_always_returns_anthropic(self):
        mock_settings = MagicMock()
        mock_settings.MODEL_BACKEND = "ollama"
        mock_settings.ANTHROPIC_API_KEY = "test-key"
        mock_settings.OLLAMA_BASE_URL = "http://localhost:11434"

        with patch("agent.models.settings", mock_settings), \
             patch("agent.models.anthropic.settings", mock_settings):
            from agent.models import get_model_client
            client = get_model_client("KH")
            assert isinstance(client, AnthropicClient)

    def test_anthropic_backend(self):
        mock_settings = MagicMock()
        mock_settings.MODEL_BACKEND = "anthropic"
        mock_settings.ANTHROPIC_API_KEY = "test-key"

        with patch("agent.models.settings", mock_settings), \
             patch("agent.models.anthropic.settings", mock_settings):
            from agent.models import get_model_client
            client = get_model_client("EN")
            assert isinstance(client, AnthropicClient)

    def test_ollama_backend(self):
        mock_settings = MagicMock()
        mock_settings.MODEL_BACKEND = "ollama"
        mock_settings.OLLAMA_BASE_URL = "http://localhost:11434"

        with patch("agent.models.settings", mock_settings), \
             patch("agent.models.ollama.settings", mock_settings):
            from agent.models import get_model_client
            client = get_model_client("EN")
            assert isinstance(client, OllamaClient)

    def test_unknown_backend_raises(self):
        mock_settings = MagicMock()
        mock_settings.MODEL_BACKEND = "invalid"

        with patch("agent.models.settings", mock_settings):
            from agent.models import get_model_client
            with pytest.raises(ValueError, match="Unknown MODEL_BACKEND"):
                get_model_client("EN")
