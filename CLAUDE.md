# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DerLg.com is a Cambodia travel booking platform with three independent services:

| Service | Stack | Port | Deploy |
|---------|-------|------|--------|
| `frontend/` | Next.js 16 (App Router), React 19, Tailwind v4, TypeScript | 3000 | Vercel |
| `backend/` | NestJS 11, Prisma 5, PostgreSQL (Supabase), Redis (Upstash) | 3001 | Railway |
| `llm_agentic_chatbot/` | Python FastAPI + LangGraph, Claude Sonnet 4.5 | 8000 | Railway |

Frontend communicates with the backend via REST and with the AI agent via WebSocket.

## Commands

### Frontend
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
```

### Backend
```bash
cd backend
npm run start:dev    # Watch mode
npm run build        # nest build
npm run lint         # ESLint with auto-fix
npm run test         # Jest
npm run test:e2e     # E2E tests
npm run test:cov     # Coverage
```

### AI Agent
```bash
cd llm_agentic_chatbot
uvicorn main:app --host 0.0.0.0 --port 8000 --reload  # Development
pytest                                                  # Tests
docker-compose up                                       # Full dev environment
```

## Architecture

### Backend (NestJS)
Feature-based module structure under `backend/src/`. All REST routes are versioned at `/v1/`. AI agent tool endpoints live at `/v1/ai-tools/` protected by `ServiceKeyGuard` (requires `X-Service-Key` header).

The `prisma/schema.prisma` defines 18 tables. Booking holds use Redis with a 15-minute TTL. JWT auth uses httpOnly cookies only — never localStorage.

### Frontend (Next.js)
App Router with Server Components by default. State is split:
- **Zustand** (`stores/`) — client state: auth, active booking flow, chat, language
- **React Query** (`lib/api.ts`) — server/cached state: API responses
- **React Hook Form + Zod** — form validation

Five main screens: home, explore, booking, my-trips, profile. Plus a separate AI chat interface (`app/chat/`). i18n supports EN/KH/ZH via `next-intl`.

### AI Agent (Python)
LangGraph state machine with 7 conversation stages:
```
DISCOVERY → SUGGESTION → EXPLORATION → CUSTOMIZATION → BOOKING → PAYMENT → POST_BOOKING
```
20 tool implementations in `agent/tools/`. Session state persists in Redis with 7-day TTL. The agent calls backend REST endpoints as tools using `AI_SERVICE_KEY`.

## Key Conventions

- **API versioning:** all backend routes use `/v1/` prefix
- **Auth:** Supabase Auth + JWT in httpOnly cookies; backend uses `ServiceKeyGuard` for AI-agent-to-backend calls
- **TypeScript strict mode** in both frontend and backend
- **Python:** Black formatting, Pylint, mypy strict — configured in `pyproject.toml`
- **Environment:** each service has its own `.env.example`; copy to `.env` before running

## Environment Setup

```bash
cp backend/.env.example backend/.env
cp llm_agentic_chatbot/.env.example llm_agentic_chatbot/.env
```

Key variables:
- `DATABASE_URL` / `DIRECT_URL` — Supabase PostgreSQL
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Redis
- `AI_SERVICE_KEY` — shared secret between backend and AI agent
- `ANTHROPIC_API_KEY` — Claude API access
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — payments

## Permanent Project Memory

Detailed feature specs, architecture decisions, and build order are in:
- `docs/` — architecture documents and feature specs (F01–F16)
- `.github/instructions/derlg.instructions.md` — main project memory
- `.claude/agents/DerLgClaude.agent.md` — agent-specific instructions
