# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DerLg.com is a Cambodia travel booking platform with four services:

| Service | Stack | Port | Deploy |
|---------|-------|------|--------|
| `frontend/` | Next.js 16 (App Router), React 19, Tailwind v4, TypeScript | 3000 | Vercel |
| `frontend_react/` | React 19, Vite, TypeScript | 5173 | TBD |
| `backend/` | NestJS 11 (ESM), Prisma 5, PostgreSQL (Supabase), Redis (Upstash) | 3001 | Railway |
| `llm_agentic_chatbot/` | Python FastAPI + LangGraph, Claude/NVIDIA/Ollama | 8000 | Railway |

The Next.js frontend (`frontend/`) is the primary target. `frontend_react/` is an alternative Vite-based SPA. Both communicate with the backend via REST; the AI agent is reached via WebSocket.

## Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest run
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright
```

### Frontend (React + Vite)
```bash
cd frontend_react
npm run dev          # Vite dev server
npm run build        # tsc + vite build
npm run lint         # ESLint
```

### Backend
```bash
cd backend
npm run start:dev    # Watch mode
npm run build        # nest build
npm run lint         # ESLint with auto-fix
npm run test         # Jest
npm run test:watch   # Jest watch
npm run test:e2e     # E2E tests
npm run test:cov     # Coverage
npm run db:migrate   # Prisma migrate dev
npm run db:push      # Prisma db push
npm run db:seed      # Prisma db seed
npm run db:studio    # Prisma Studio
npm run db:reset     # Prisma migrate reset
npm run prisma:merge # Merge split Prisma schemas (custom script)
```

### AI Agent
```bash
cd llm_agentic_chatbot
uvicorn main:app --host 0.0.0.0 --port 8000 --reload  # Development
pytest                                                  # Tests (requires SKIP_SETTINGS_INIT=1)
docker-compose up                                       # Full dev environment
```

## Architecture

### Backend (NestJS)
Feature-based module structure under `backend/src/`. All REST routes are versioned at `/v1/`. AI agent tool endpoints live at `/v1/ai-tools/` protected by `ServiceKeyGuard` (requires `X-Service-Key` header).

The backend is configured as **ESM** (`"type": "module"` in package.json). The `prisma/schema.prisma` defines 18 tables. Booking holds use Redis with a 15-minute TTL. JWT auth uses httpOnly cookies only — never localStorage.

### Frontend (Next.js)
App Router with Server Components by default. State is split:
- **Zustand** (`stores/`) — client state: auth, active booking flow, chat, language
- **React Query** (`lib/api.ts`) — server/cached state: API responses
- **React Hook Form + Zod** — form validation

Five main screens: home, explore, booking, my-trips, profile. Plus a separate AI chat interface (`app/chat/`). i18n supports EN/KH/ZH via `next-intl`.

There is no `.env.example` in `frontend/` or `frontend_react/` — required variables are documented in their respective READMEs.

### AI Agent (Python)
LangGraph state machine with 7 conversation stages:
```
DISCOVERY -> SUGGESTION -> EXPLORATION -> CUSTOMIZATION -> BOOKING -> PAYMENT -> POST_BOOKING
```
20 tool implementations in `agent/tools/`. Session state persists in Redis with 7-day TTL. The agent calls backend REST endpoints as tools using `AI_SERVICE_KEY`.

The agent supports three LLM backends: `anthropic` (Claude), `ollama` (local), and `nvidia` (NVIDIA API). Backend selection is controlled by `MODEL_BACKEND` and `LLM_MODEL_SELECTED`.

## Key Conventions

- **API versioning:** all backend routes use `/v1/` prefix
- **Auth:** Supabase Auth + JWT in httpOnly cookies; backend uses `ServiceKeyGuard` for AI-agent-to-backend calls
- **TypeScript strict mode** in both frontend and backend
- **Python:** Black formatting, Pylint, mypy strict — configured in `pyproject.toml`
- **Backend ESM:** all backend code runs as ES modules; use `import` syntax
- **Environment:** each service has its own `.env.example` (except frontends); copy to `.env` before running

## Environment Setup

```bash
cp backend/.env.example backend/.env
cp llm_agentic_chatbot/.env.example llm_agentic_chatbot/.env
```

Key backend variables:
- `DATABASE_URL` / `DIRECT_URL` — Supabase PostgreSQL
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — min 32 chars each
- `REDIS_URL` — Redis connection
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis (if used)
- `AI_SERVICE_KEY` — shared secret between backend and AI agent (min 16 chars)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — payments
- `CORS_ORIGINS` — comma-separated allowed origins

Key AI agent variables:
- `MODEL_BACKEND` — `anthropic`, `ollama`, or `nvidia`
- `ANTHROPIC_API_KEY` — required when `MODEL_BACKEND=anthropic`
- `NVIDIA_API_KEY` — required when `MODEL_BACKEND=nvidia`
- `LLM_MODEL_SELECTED` — model name (default: `openai/gpt-oss-120b`)
- `BACKEND_URL` — NestJS base URL (no trailing slash)
- `AI_SERVICE_KEY` — shared secret (min 32 chars)
- `REDIS_URL` — session storage
- `ALLOWED_ORIGINS` — CORS origins
- `WS_PING_INTERVAL` / `WS_TIMEOUT` / `MAX_CONNECTIONS` — WebSocket tuning

Key frontend variables (see `frontend/README.md`):
- `NEXT_PUBLIC_API_URL` — backend base URL
- `NEXT_PUBLIC_WS_URL` — AI agent WebSocket URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe public key

## Testing Notes

- **Backend tests:** standard Jest. Run single test file: `npx jest src/auth/auth.service.spec.ts`
- **AI agent tests:** always prefix with `SKIP_SETTINGS_INIT=1` to bypass Pydantic settings validation during test collection:
  ```bash
  SKIP_SETTINGS_INIT=1 pytest
  SKIP_SETTINGS_INIT=1 pytest -m unit
  SKIP_SETTINGS_INIT=1 pytest tests/unit/test_tool_schemas.py
  ```
- **Frontend tests:** Vitest for unit, Playwright for E2E.

## Permanent Project Memory

Detailed feature specs, architecture decisions, and build order are in:
- `docs/` — architecture documents and feature specs (F01–F16)
- `.github/instructions/derlg.instructions.md` — main project memory
- `.claude/agents/DerLgClaude.agent.md` — agent-specific instructions

## Documentation Reference

| Topic | File |
|---|---|
| System architecture | `docs/architectures/system.design.interact.architectures.md` |
| Backend architecture | `docs/architectures/backend.architecture.md` |
| Frontend architecture | `docs/architectures/frontend.architecture.md` |
| AI agent architecture | `docs/architectures/Agentic.llm.chatbot.md` |
| DB schema | `docs/backend/01-database-schema.md` |
| Auth system | `docs/backend/02-authentication.md` |
| Payment system | `docs/backend/06-payment-system.md` |
| AI state machine | `docs/agentic_chatbots_llm/A-01-conversation-state.md` |
| AI system prompts | `docs/agentic_chatbots_llm/A-02-system-prompt-design.md` |
| AI tools API | `docs/agentic_chatbots_llm/14-ai-tools-api.md` |
| QA test scenarios | `docs/agentic_chatbots_llm/QA_bugs_hunter/` |
| Feature specs | `docs/features/F01-ai-chat.md` through `F14-F16-batch.md` |
