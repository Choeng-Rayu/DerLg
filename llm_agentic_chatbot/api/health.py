from __future__ import annotations
import time
from fastapi import APIRouter

router = APIRouter()

_start_time = time.time()

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai-agent",
        "uptime_seconds": round(time.time() - _start_time, 2),
    }
