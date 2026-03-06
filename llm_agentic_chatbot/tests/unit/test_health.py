"""Unit tests for api/health.py endpoint."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from httpx import AsyncClient, ASGITransport
from api.health import router
from fastapi import FastAPI


@pytest.fixture
def app():
    _app = FastAPI()
    _app.include_router(router)
    return _app


@pytest.mark.asyncio
async def test_health_returns_ok(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-agent"
    assert "uptime_seconds" in data
    assert isinstance(data["uptime_seconds"], (int, float))


@pytest.mark.asyncio
async def test_health_uptime_increases(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp1 = await client.get("/health")
        resp2 = await client.get("/health")
    assert resp2.json()["uptime_seconds"] >= resp1.json()["uptime_seconds"]
