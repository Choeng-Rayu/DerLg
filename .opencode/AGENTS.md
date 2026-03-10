# AGENTS.md

# OpenCode Master Agent
  You are the lead orchestrator for the OpenCode developer team.
  
# Core Logic
  - Follow the architectural patterns defined in `@docs/architectures/`.
  - Ensure all backend changes align with `@docs/backend/00-project-overview.md`.
  
Instructions for coding agents working in `/home/khaidev/DerLg`.
This repository has three active app projects:
- `frontend/` - Next.js + TypeScript
- `backend/` - NestJS + TypeScript
- `llm_agentic_chatbot/` - FastAPI + Python

## Project Layout

- Work in the smallest relevant subproject.
- Avoid cross-project changes unless required.
- `docs/` is documentation, not a runtime app.
- Run commands from each app directory.

## Build/Lint/Test Commands

### Frontend (`frontend/`)

Install:
```bash
npm install
```

Dev server:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Start prod server:
```bash
npm run start
```

Lint:
```bash
npm run lint
```

Tests:
- No test script is currently defined in `frontend/package.json`.
- If tests are added, add explicit scripts (Vitest or Jest preferred).

### Backend (`backend/`)

Install:
```bash
npm install
```

Dev server:
```bash
npm run start:dev
```

Build:
```bash
npm run build
```

Lint (auto-fix enabled by script):
```bash
npm run lint
```

Format:
```bash
npm run format
```

Run all unit tests:
```bash
npm run test
```

Run a single unit test file:
```bash
npm run test -- app.controller.spec.ts
```

Run a single unit test by name:
```bash
npm run test -- -t "should return Hello World"
```

Run all e2e tests:
```bash
npm run test:e2e
```

Run a single e2e file:
```bash
npm run test:e2e -- app.e2e-spec.ts
```

Coverage:
```bash
npm run test:cov
```

### AI Agent (`llm_agentic_chatbot/`)

Install:
```bash
pip install -r requirements.txt
```

Dev server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Prod entrypoint:
```bash
python main.py
```

Format:
```bash
black .
```

Lint:
```bash
pylint agent api utils config
```

Type check:
```bash
mypy .
```

Run all tests:
```bash
SKIP_SETTINGS_INIT=1 pytest
```

Run one test folder:
```bash
SKIP_SETTINGS_INIT=1 pytest tests/unit/
```

Run one test file:
```bash
SKIP_SETTINGS_INIT=1 pytest tests/unit/test_tool_schemas.py
```

Run one test function:
```bash
SKIP_SETTINGS_INIT=1 pytest tests/unit/test_state.py::test_default_state_is_discovery
```

Run by marker:
```bash
SKIP_SETTINGS_INIT=1 pytest -m unit
SKIP_SETTINGS_INIT=1 pytest -m integration
SKIP_SETTINGS_INIT=1 pytest -m property
```

Run coverage:
```bash
SKIP_SETTINGS_INIT=1 pytest --cov=agent --cov=api --cov=utils --cov-report=term-missing
```

## Style Guidelines

### General

- Keep changes minimal, local, and task-focused.
- Avoid unrelated formatting churn.
- Never hardcode credentials/secrets.
- Update tests and docs when behavior changes.

### Imports

- Remove unused imports.
- Group imports: stdlib, third-party, local.
- Avoid wildcard imports.
- Python files commonly follow:
  1) `from __future__`
  2) stdlib
  3) third-party
  4) local modules

### Formatting

- Python formatting is Black with line length 100.
- Backend formatting is Prettier via ESLint integration.
- Frontend formatting follows Next.js ESLint rules.
- Preserve existing quote style per project:
  - Backend TS tends to use single quotes.
  - Frontend TS tends to use double quotes.

### Types

- Frontend TS is strict; avoid `any`.
- Backend TS allows some flexibility, but prefer explicit types on public APIs.
- Python mypy is strict; add full annotations in production code.
- Prefer modern Python typing (`dict[str, Any]`, `list[str]`, `X | None`).

### Naming

- TypeScript classes/components: `PascalCase`.
- TypeScript variables/functions: `camelCase`.
- Python modules/functions/variables: `snake_case`.
- Python classes/enums: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Keep framework file names:
  - NestJS: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.spec.ts`
  - Next.js routes: `page.tsx`, `layout.tsx`

### Error Handling and Logging

- Fail fast on invalid state; do not silently ignore errors.
- Keep user-facing errors actionable.
- Preserve `response.raise_for_status()` in Python backend-call handlers.
- Keep structured logging patterns (`structlog`) in AI agent code.
- Catch exceptions only when adding context or recovery.

### Testing Practice

- Prefer targeted tests while iterating.
- Run broader suites before handoff.
- For AI agent tests, include `SKIP_SETTINGS_INIT=1` unless testing settings init.

## Cursor/Copilot Rule Files

Checked these rule files and they are currently absent:
- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`

If any are added later, treat them as high-priority local instructions and update this file.
