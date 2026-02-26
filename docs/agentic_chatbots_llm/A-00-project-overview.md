# DerLg.com — AI Agent Project Overview

**Language:** Python 3.11+  
**AI Model (Phase 1):** Claude API (claude-sonnet-4-5-20251001)  
**AI Model (Future):** Local model (Ollama / LLaMA)  
**Framework:** FastAPI + LangGraph  
**Folder:** `apps/ai-agent/`  
**Communicates with:** NestJS Backend via HTTP tool calls

---

## 1. Role of the AI Agent

The AI Agent is the brain of DerLg.com. It is a Python service that:

- Maintains stateful conversations with users (7-day session persistence via Redis)
- Understands natural language in English, Khmer, and Chinese
- Progresses through a defined booking journey (7 stages)
- Calls NestJS backend tool endpoints to fetch real data, create bookings, and process payments
- Never invents data — all factual content comes from tool call results
- Responds with structured JSON messages that the frontend renders as rich UI components

The AI Agent is NOT a general chatbot. It is purpose-built for Cambodia travel and has strict rules about what it will and won't do.

---

## 2. Architecture Overview

```
Frontend (Next.js)
       │
       │ WebSocket (wss://agent.derlg.com/ws/{session_id})
       ▼
FastAPI WebSocket Server
       │
       ▼
LangGraph State Machine (FSM)
       │
       ├─── System Prompt Builder (state-aware)
       │
       ├─── Claude API (claude-sonnet-4-5)
       │         │
       │         ▼
       │    Tool Use Decision
       │         │
       ├─── Tool Executor
       │         │
       │         ▼
       │    NestJS Backend API
       │    POST /v1/ai-tools/...
       │
       ├─── Response Formatter
       │    (converts data → structured message types)
       │
       └─── Redis Session Manager
            (save/load conversation state, 7-day TTL)
```

---

## 3. Folder Structure

```
apps/ai-agent/
├── main.py                          # FastAPI app entry point
├── requirements.txt
├── .env.example
│
├── agent/
│   ├── agent.py                     # Core LangGraph agent loop
│   ├── states.py                    # ConversationState model
│   ├── transitions.py               # State machine transitions
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── schemas.py               # Tool JSON schemas for Claude API
│   │   ├── executor.py              # Tool call dispatcher
│   │   └── handlers/
│   │       ├── trip_tools.py        # Trip-related tool implementations
│   │       ├── booking_tools.py     # Booking tool implementations
│   │       ├── payment_tools.py     # Payment tool implementations
│   │       ├── explore_tools.py     # Places/weather tool implementations
│   │       └── budget_tools.py      # Budget planner tool implementations
│   │
│   ├── prompts/
│   │   ├── builder.py               # Dynamic system prompt builder
│   │   ├── base_prompt.py           # Core identity and rules
│   │   └── state_prompts.py         # Per-state instructions
│   │
│   └── formatters/
│       ├── response_formatter.py    # Convert tool data → structured messages
│       └── message_types.py         # Message type definitions
│
├── session/
│   ├── redis_session.py             # Save/load ConversationState to Redis
│   └── session_manager.py           # Session lifecycle management
│
├── api/
│   ├── websocket.py                 # WebSocket endpoint handler
│   └── health.py                    # Health check endpoint
│
└── config/
    ├── settings.py                  # Pydantic settings from .env
    └── constants.py                 # Agent state names, tool names
```

---

## 4. Phase 1 vs Future Architecture

### Phase 1 — Claude API (Current)

The agent uses the Anthropic Claude API with tool calling. This is the recommended starting point:
- Fastest to build and test
- Best-in-class natural language understanding
- Native tool use (function calling) support
- Multi-language capability (EN, KH, ZH) out of the box
- Usage is billed per token

The Claude model used: `claude-sonnet-4-5-20251001`

The API call pattern:
```python
response = anthropic_client.messages.create(
    model="claude-sonnet-4-5-20251001",
    max_tokens=2048,
    system=build_system_prompt(session),
    messages=session.messages[-20:],
    tools=TRAVEL_TOOLS
)
```

### Future Phase — Local Model (Ollama)

When the team wants to reduce API costs or run fully offline, the architecture allows swapping the Anthropic client with an Ollama-compatible client. The tool schemas and system prompts remain the same. Only the `anthropic_client.messages.create()` call is replaced with an `openai`-compatible Ollama request.

The agent code uses a `ModelClient` interface so switching is a one-line config change:
```python
MODEL_BACKEND = os.getenv("MODEL_BACKEND", "anthropic")  # or "ollama"
```

Local model candidates for future:
- LLaMA 3.1 8B (multilingual)
- Mistral 7B (lightweight, good instruction following)
- Qwen 2.5 (strong Chinese language support — useful for Chinese travelers)

---

## 5. Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Runtime | Python 3.11+ | |
| API Server | FastAPI | WebSocket and REST endpoints |
| Agent Framework | LangGraph | State machine for conversation flow |
| AI Model | Anthropic SDK (Phase 1) | Claude tool use |
| Session Cache | Redis (redis-py) | Conversation state, 7-day TTL |
| HTTP Client | httpx (async) | Calls to NestJS backend tool endpoints |
| Validation | Pydantic v2 | State model validation |
| Logging | structlog | Structured JSON logs |
| Error Tracking | Sentry SDK | Exception monitoring |
| Testing | pytest + pytest-asyncio | Async test coverage |
| Deploy | Docker | Containerized service |

---

## 6. Document Index

| File | Topic |
|---|---|
| `A-01-conversation-state.md` | ConversationState model, 7 stages |
| `A-02-system-prompt-design.md` | System prompt builder, per-state instructions |
| `A-03-tool-schemas.md` | All 20 tool JSON schemas for Claude API |
| `A-04-agent-loop.md` | Core agent loop, tool execution, response formatting |
| `A-05-session-management.md` | Redis session lifecycle, TTL, recovery |
| `A-06-response-formatting.md` | Converting tool data to frontend message types |
| `A-07-multilingual.md` | Handling EN, KH, ZH in the agent |
| `A-08-edge-cases.md` | All edge cases and how the agent handles them |
| `A-09-local-model-migration.md` | How to switch from Claude API to local model |
| `A-10-testing-guide.md` | How to test agent flows end-to-end |
