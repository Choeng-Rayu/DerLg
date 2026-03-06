# DerLg AI Agent -- Deployment Runbook

This document covers deployment procedures, rollback steps, incident response,
and known limitations for the DerLg AI Agent service.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deployment Procedure](#deployment-procedure)
4. [Health Verification](#health-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Incident Response](#incident-response)
7. [Known Limitations](#known-limitations)

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Python | 3.11+ |
| Redis | 7.x (Upstash serverless recommended) |
| Docker | 24.x+ (for containerized deployments) |
| Railway CLI | Latest (if deploying to Railway) |
| NestJS Backend | Must be deployed and reachable first |

Before deploying, run the production readiness checklist:

```bash
python scripts/check_production.py --verbose
```

Fix all FAIL items before proceeding.

---

## Environment Variables

All variables must be set in the deployment environment (Railway dashboard,
`.env` file for local, or CI/CD secrets).

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MODEL_BACKEND` | LLM provider (`anthropic` or `ollama`) | `anthropic` |
| `ANTHROPIC_API_KEY` | Anthropic API key (required when `MODEL_BACKEND=anthropic`) | `sk-ant-...` |
| `BACKEND_URL` | NestJS backend base URL (no trailing slash) | `https://api.derlg.com` |
| `AI_SERVICE_KEY` | Shared secret for backend auth (min 32 chars) | `openssl rand -hex 32` |
| `REDIS_URL` | Redis connection string | `rediss://default:xxx@host:port` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Bind address | `0.0.0.0` |
| `PORT` | HTTP port | `8000` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `SENTRY_DSN` | Sentry error tracking DSN | (disabled) |
| `OLLAMA_BASE_URL` | Ollama server URL (required when `MODEL_BACKEND=ollama`) | `http://localhost:11434` |

### Generating a Secure Service Key

```bash
openssl rand -hex 32
```

Copy the output and set it identically on **both** the AI Agent and the NestJS
backend (`AI_SERVICE_KEY`).

---

## Deployment Procedure

### Railway (Production)

1. **Verify NestJS backend is healthy:**

   ```bash
   curl https://api.derlg.com/v1/health
   ```

2. **Push to the deployment branch:**

   ```bash
   git push origin main
   ```

   Railway auto-deploys on push to the configured branch.

3. **Or deploy manually via Railway CLI:**

   ```bash
   cd llm_agentic_chatbot
   railway up
   ```

4. **Monitor deployment logs:**

   ```bash
   railway logs --tail
   ```

5. **Verify health endpoint:**

   ```bash
   curl https://ai.derlg.com/health
   ```

   Expected response:
   ```json
   {"status": "ok", "service": "ai-agent", "uptime_seconds": 12.34}
   ```

### Docker (Manual)

1. **Build the image:**

   ```bash
   docker build -t derlg-ai-agent:latest -f Dockerfile .
   ```

2. **Run the container:**

   ```bash
   docker run -d \
     --name derlg-ai-agent \
     -p 8000:8000 \
     --env-file .env.production \
     derlg-ai-agent:latest
   ```

3. **Verify:**

   ```bash
   docker logs derlg-ai-agent
   curl http://localhost:8000/health
   ```

### Docker Compose (Staging)

```bash
docker-compose up -d
curl http://localhost:8000/health
```

---

## Health Verification

After every deployment, verify all three layers are operational:

### 1. Health Endpoint

```bash
curl -s https://ai.derlg.com/health | python -m json.tool
```

### 2. Metrics Endpoint

```bash
curl -s https://ai.derlg.com/metrics
```

Check that `ai_agent_uptime_seconds` is a small positive number (just deployed)
and error counters are at zero.

### 3. WebSocket Connectivity

```python
import asyncio
import websockets
import json

async def test_ws():
    uri = "wss://ai.derlg.com/ws/test-session-id"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"type": "auth", "user_id": "test", "language": "EN"}))
        response = json.loads(await ws.recv())
        print(response)  # Should be welcome message

asyncio.run(test_ws())
```

### 4. Production Readiness Script

```bash
python scripts/check_production.py --verbose
```

---

## Rollback Procedures

### Railway Rollback

Railway keeps deployment history. To revert:

1. **Via Dashboard:**
   - Go to the AI Agent service in Railway
   - Click "Deployments" tab
   - Find the last known-good deployment
   - Click "Redeploy"

2. **Via CLI:**

   ```bash
   railway rollback
   ```

3. **Via Git revert:**

   ```bash
   git revert HEAD
   git push origin main
   ```

### Docker Rollback

1. **Stop the current container:**

   ```bash
   docker stop derlg-ai-agent
   docker rm derlg-ai-agent
   ```

2. **Run the previous image version:**

   ```bash
   docker run -d \
     --name derlg-ai-agent \
     -p 8000:8000 \
     --env-file .env.production \
     derlg-ai-agent:previous-tag
   ```

### Database Considerations

The AI Agent does not write directly to PostgreSQL (all writes go through
the NestJS backend). Redis session data is ephemeral and will naturally
expire (7-day TTL). No database migration rollback is needed for AI Agent
deployments.

### Post-Rollback Verification

After rollback, run the same health verification steps as a normal deployment:

```bash
curl https://ai.derlg.com/health
curl https://ai.derlg.com/metrics
```

---

## Incident Response

### Severity Levels

| Level | Criteria | Response Time |
|-------|----------|---------------|
| P0 (Critical) | Service completely down, no users can chat | Immediate (< 15 min) |
| P1 (High) | Degraded: booking/payment flow broken | < 1 hour |
| P2 (Medium) | Partial: some tools failing, slow responses | < 4 hours |
| P3 (Low) | Cosmetic: formatting issues, non-critical warnings | Next business day |

### P0: Service Down

1. **Check Railway/Docker logs for crash reason:**

   ```bash
   railway logs --tail 100
   ```

2. **Check health endpoint:**

   ```bash
   curl -v https://ai.derlg.com/health
   ```

3. **If the service is crashing on startup (bad config):**
   - Check environment variables in Railway dashboard
   - Verify `ANTHROPIC_API_KEY` has not been revoked
   - Verify `REDIS_URL` is valid and Redis is up

4. **If the issue is in new code:**
   - Immediately rollback to last known-good deployment
   - Investigate the failing commit offline

5. **If Redis is down:**
   - The agent degrades gracefully (sessions are lost but chat still works)
   - Check Upstash dashboard for outages
   - Contact Upstash support if needed

### P1: Booking/Payment Flow Broken

1. **Check the circuit breaker state via logs:**

   Look for `circuit_breaker_opened` events in recent logs.

2. **Verify NestJS backend is healthy:**

   ```bash
   curl https://api.derlg.com/v1/health
   ```

3. **If backend is down:** Escalate to backend team. The AI Agent circuit
   breaker will automatically recover once the backend is back.

4. **If Stripe webhooks are failing:** Check the payment listener logs and
   verify the webhook secret matches.

### P2: Slow Responses or Tool Failures

1. **Check Anthropic API status:** https://status.anthropic.com/

2. **Check metrics for elevated error rates:**

   ```bash
   curl https://ai.derlg.com/metrics | grep errors_total
   ```

3. **Check tool-specific metrics:**

   ```bash
   curl https://ai.derlg.com/metrics | grep tool_usage_by_name
   ```

4. **If a specific tool is failing repeatedly:** The circuit breaker may be
   tripped. It will auto-recover after 30 seconds.

### Communication Template

```
[DerLg AI Agent - Pn Incident]

Status: Investigating / Identified / Resolved
Impact: <describe user impact>
Start time: <UTC timestamp>
Root cause: <once identified>
Resolution: <steps taken>
Follow-up: <preventive measures>
```

---

## Known Limitations

### Language Support

- **Khmer (KH):** Claude's Khmer language quality is limited. Responses may
  occasionally contain grammatical errors or unnatural phrasing. This is
  acceptable for Phase 1 and will improve with future model upgrades.
- **Chinese (ZH):** Simplified Chinese only. Traditional Chinese is not
  explicitly supported.

### Conversation Limits

- **Message window:** Only the last 20 messages are sent to the LLM per turn
  (`MESSAGE_WINDOW=20` in `agent/graph.py`). Older messages are pruned to stay
  within context limits. This means the agent may lose track of details
  mentioned early in very long conversations.
- **Tool loop limit:** The agent can call tools at most 5 times per turn
  (`MAX_TOOL_LOOPS=5`). Complex requests requiring more tool calls will
  receive a partial response.
- **Max tokens:** Responses are limited to 2048 tokens per turn.

### Session & Booking

- **Session TTL:** Sessions expire after 7 days of inactivity. Users returning
  after 7 days will start a fresh conversation.
- **Booking hold:** Unpaid bookings are automatically cancelled after 15
  minutes. The Redis TTL handles this; if Redis is down when the hold expires,
  the session manager detects expired holds on next load.
- **Single booking per session:** Each conversation session tracks one active
  booking at a time.

### Infrastructure

- **Redis dependency:** If Redis is completely unavailable:
  - Sessions are not persisted (in-memory only for that connection)
  - Rate limiting fails open (all requests allowed)
  - Booking holds cannot be tracked
  - The agent still functions for basic conversation

- **Anthropic API dependency:** If the Anthropic API is down or rate-limited:
  - The agent retries once with a 1-second backoff
  - After exhausting retries, a user-friendly error is returned
  - No local fallback model is available in `anthropic` mode

- **Backend dependency:** If the NestJS backend is unreachable:
  - The circuit breaker opens after 5 consecutive failures
  - All tool calls are blocked for 30 seconds (recovery timeout)
  - The agent can still converse but cannot fetch data or create bookings

### Performance

- **No horizontal auto-scaling:** The Dockerfile runs 2 uvicorn workers.
  Scaling beyond this requires configuring Railway or Docker Swarm/K8s
  replicas.
- **In-memory cache:** The TTL cache (`utils/cache.py`) is per-process and
  not shared across workers. Each worker maintains its own cache.
- **WebSocket sticky sessions:** If running multiple replicas behind a load
  balancer, WebSocket connections must use sticky sessions (session affinity)
  so messages route to the same worker.

### Security

- **JWT tokens:** The AI Agent does not validate user JWTs directly. It
  trusts the `user_id` sent in the WebSocket auth message. Production
  deployments should ensure the frontend validates JWTs before connecting.
- **Service key rotation:** Changing `AI_SERVICE_KEY` requires simultaneous
  updates to both the AI Agent and NestJS backend, or a brief period of
  auth failures.

### Monitoring

- **Metrics are in-memory:** The Prometheus-format `/metrics` endpoint resets
  on service restart. For persistent metrics, scrape with a Prometheus server
  or use a hosted monitoring service.
- **No distributed tracing:** Request IDs are not propagated across
  AI Agent -> NestJS backend calls. This is planned for a future phase.
