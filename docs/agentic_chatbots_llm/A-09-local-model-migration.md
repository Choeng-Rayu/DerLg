# DerLg.com AI Agent — Local Model Migration Guide

**File:** `agent/agent.py` + `config/settings.py`

---

## 1. Overview

DerLg.com's AI agent is built with a model-agnostic interface so that switching from the Anthropic Claude API to a local model (via Ollama) is a configuration change, not a code rewrite.

This document explains when to make the switch, which local models to consider, what capabilities you will gain or lose, and how to perform the migration.

---

## 2. When to Consider a Local Model

### Switch when:
- Monthly Claude API costs exceed the budget threshold (roughly $500+/month for production traffic)
- You need the agent to run fully on-premises (data sovereignty requirements)
- You want zero-latency inference for certain response types
- You have GPU infrastructure available (minimum: 16GB VRAM for 7B models)

### Do NOT switch when:
- You are still in MVP / testing phase (API is faster to iterate)
- Traffic is low (API is cheaper than running GPU infra at low utilization)
- You need best-in-class multilingual quality (especially Khmer — local models lag significantly)
- You cannot guarantee 99.9% local model uptime (API has SLA; self-hosted does not)

---

## 3. Model Selection Guide

### For English + Chinese (good coverage)

| Model | Parameters | VRAM Needed | Strengths | Weaknesses |
|---|---|---|---|---|
| Qwen 2.5 7B | 7B | ~8GB | Strong Chinese, good instruction following | Moderate Khmer |
| Qwen 2.5 14B | 14B | ~16GB | Best Chinese, very good EN | Khmer still limited |
| LLaMA 3.1 8B | 8B | ~10GB | Best English quality | Weak Chinese, poor Khmer |
| Mistral 7B v0.3 | 7B | ~8GB | Fast, good EN | Limited multilingual |

### For Khmer language support

No open-source model currently has strong Khmer support. For Khmer, the recommended approach for Phase 2 is a **hybrid**: use a local model for English and Chinese, but fall back to Claude API for Khmer conversations.

This hybrid is easily implemented via the `ModelClient` interface:

```python
def get_model_client(language: str) -> ModelClient:
    if language == "KH":
        return AnthropicClient()   # Claude API for Khmer
    else:
        return OllamaClient()       # Local model for EN/ZH
```

---

## 4. Architecture: ModelClient Interface

The agent code uses a `ModelClient` abstract interface so the model backend can be swapped:

```python
# agent/model_client.py

from abc import ABC, abstractmethod

class ModelClient(ABC):
    @abstractmethod
    async def create_message(
        self,
        system: str,
        messages: list[dict],
        tools: list[dict],
        max_tokens: int = 2048
    ) -> ModelResponse:
        pass

class ModelResponse:
    stop_reason: str      # "tool_use" or "end_turn"
    content: list         # List of text or tool_use blocks
```

---

## 5. Phase 1: Anthropic Client (Current)

```python
# agent/model_clients/anthropic_client.py

import anthropic
from agent.model_client import ModelClient, ModelResponse

class AnthropicClient(ModelClient):
    def __init__(self):
        self.client = anthropic.AsyncAnthropic()
        self.model = "claude-sonnet-4-5-20251001"

    async def create_message(self, system, messages, tools, max_tokens=2048):
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
            tools=tools
        )
        return ModelResponse(
            stop_reason=response.stop_reason,
            content=response.content
        )
```

---

## 6. Phase 2: Ollama Client (Future)

Ollama exposes an OpenAI-compatible API. The Ollama client translates the Claude-style tool schema into OpenAI function calling format.

```python
# agent/model_clients/ollama_client.py

import httpx
from agent.model_client import ModelClient, ModelResponse
from agent.model_clients.schema_converter import claude_tools_to_openai

class OllamaClient(ModelClient):
    def __init__(self, model: str = "qwen2.5:14b", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url

    async def create_message(self, system, messages, tools, max_tokens=2048):
        # Convert Claude tool schemas to OpenAI format
        openai_tools = claude_tools_to_openai(tools)

        # Convert Claude message format to OpenAI format
        openai_messages = [{"role": "system", "content": system}] + messages

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": openai_messages,
                    "tools": openai_tools,
                    "max_tokens": max_tokens
                },
                timeout=60.0  # local models may be slower
            )
            response.raise_for_status()
            data = response.json()

        choice = data["choices"][0]
        return self._parse_response(choice)

    def _parse_response(self, choice: dict) -> ModelResponse:
        message = choice["message"]

        if message.get("tool_calls"):
            # Convert OpenAI tool calls back to Claude-style format
            content = [
                {
                    "type": "tool_use",
                    "id": tc["id"],
                    "name": tc["function"]["name"],
                    "input": json.loads(tc["function"]["arguments"])
                }
                for tc in message["tool_calls"]
            ]
            return ModelResponse(stop_reason="tool_use", content=content)
        else:
            return ModelResponse(
                stop_reason="end_turn",
                content=[{"type": "text", "text": message["content"]}]
            )
```

---

## 7. Schema Conversion (Claude Tools → OpenAI Format)

Claude API tools use a slightly different schema format than OpenAI function calling. A converter handles this:

```python
# agent/model_clients/schema_converter.py

def claude_tools_to_openai(claude_tools: list[dict]) -> list[dict]:
    """Convert Claude tool schemas to OpenAI function calling format."""
    return [
        {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["input_schema"]
            }
        }
        for tool in claude_tools
    ]
```

---

## 8. Configuration Switch

The model backend is controlled by a single environment variable:

```env
# .env

MODEL_BACKEND=anthropic          # "anthropic" | "ollama"
ANTHROPIC_API_KEY=sk-ant-...     # Required for anthropic backend
OLLAMA_BASE_URL=http://localhost:11434   # Required for ollama backend
OLLAMA_MODEL=qwen2.5:14b         # Model to use with Ollama
```

In `config/settings.py`:

```python
def get_model_client(language: str = "EN") -> ModelClient:
    backend = settings.MODEL_BACKEND

    if backend == "anthropic":
        return AnthropicClient()
    elif backend == "ollama":
        if language == "KH" and settings.KHMER_FALLBACK_TO_ANTHROPIC:
            return AnthropicClient()   # Fallback for Khmer
        return OllamaClient(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL
        )
    else:
        raise ValueError(f"Unknown MODEL_BACKEND: {backend}")
```

---

## 9. Performance Considerations for Local Models

### Latency

Local 7B models on modern GPU: ~1-3 seconds per response token (slower than Claude API's streaming)

To compensate:
- Stream tokens to the frontend as they are generated
- Show typing indicator immediately when the user sends a message
- Cache common responses (weather forecasts, popular place descriptions) in Redis

### Quality Degradation

Local models may:
- Be less accurate at extracting intent from vague user inputs
- Produce more verbose responses (increase system prompt instructions to "be concise")
- Make more tool call errors (validate tool inputs more aggressively)
- Struggle with Khmer (use hybrid approach)

### Testing Before Production

Before switching to a local model in production:

1. Run the same test conversation set through both models (see `A-10-testing-guide.md`)
2. Compare: does the local model reach the correct booking stage in the same number of turns?
3. Check: does it correctly call tools vs. hallucinate data?
4. Check: does it respect the "one question at a time" rule?
5. Measure: average tokens per conversation to estimate inference time and cost

---

## 10. Rollback Plan

If the local model performs poorly in production:

1. Set `MODEL_BACKEND=anthropic` in the environment variable
2. Restart the AI agent service
3. All new conversations will immediately use Claude API
4. No data migration needed — sessions and conversation history are model-agnostic

The switch takes under 60 seconds.
