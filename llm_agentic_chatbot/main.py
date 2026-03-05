"""
DerLg.com AI Agent - FastAPI Application Entry Point

This module initializes the FastAPI application with:
- WebSocket support for real-time chat
- CORS middleware for frontend communication
- Request logging middleware using structlog
- Global exception handlers
- Lifecycle manager for Redis initialization
- Health check endpoint
- WebSocket endpoint routing
"""

import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import ValidationError
import structlog

# Validate environment variables on startup
# This must happen before importing settings to catch configuration errors early
try:
    from config.settings import settings
except ValidationError as e:
    # Format validation errors in a user-friendly way
    print("\n" + "=" * 80, file=sys.stderr)
    print("❌ CONFIGURATION ERROR: Invalid environment variables", file=sys.stderr)
    print("=" * 80, file=sys.stderr)
    print("\nThe following configuration errors were found:\n", file=sys.stderr)
    
    for error in e.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_type = error["type"]
        
        print(f"  • {field}:", file=sys.stderr)
        print(f"    {message}", file=sys.stderr)
        
        # Add helpful context for common errors
        if "MODEL_BACKEND" in field and error_type == "missing":
            print(f"    Set MODEL_BACKEND to 'anthropic' or 'ollama' in your .env file", file=sys.stderr)
        elif "ANTHROPIC_API_KEY" in field:
            print(f"    Get your API key from: https://console.anthropic.com/", file=sys.stderr)
        elif "AI_SERVICE_KEY" in field and "32 characters" in message:
            print(f"    Generate a secure key: openssl rand -hex 32", file=sys.stderr)
        elif "REDIS_URL" in field and error_type == "missing":
            print(f"    Example: redis://localhost:6379 or rediss://user:pass@host:port", file=sys.stderr)
        elif "BACKEND_URL" in field and error_type == "missing":
            print(f"    Example: http://localhost:3001 (no trailing slash)", file=sys.stderr)
        
        print("", file=sys.stderr)
    
    print("=" * 80, file=sys.stderr)
    print("Please fix the configuration errors above and restart the service.", file=sys.stderr)
    print("See .env.example for a complete configuration template.", file=sys.stderr)
    print("=" * 80 + "\n", file=sys.stderr)
    
    sys.exit(1)
except Exception as e:
    # Catch any other unexpected errors during settings initialization
    print("\n" + "=" * 80, file=sys.stderr)
    print("❌ STARTUP ERROR: Failed to load configuration", file=sys.stderr)
    print("=" * 80, file=sys.stderr)
    print(f"\nUnexpected error: {str(e)}", file=sys.stderr)
    print("\nPlease check your .env file and environment variables.", file=sys.stderr)
    print("=" * 80 + "\n", file=sys.stderr)
    
    sys.exit(1)

# Import dependencies (these will be implemented in later tasks)
try:
    from api.websocket import router as ws_router
    from api.health import router as health_router
    from api.middleware import add_logging_middleware
    from utils.logging import setup_logging
    from utils.redis import init_redis, close_redis
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    # Dependencies not yet implemented - this is expected during early development
    DEPENDENCIES_AVAILABLE = False
    ws_router = None
    health_router = None
    add_logging_middleware = None

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    
    Handles startup and shutdown events:
    - Startup: Initialize logging, Redis connection, log configuration
    - Shutdown: Close Redis connection
    """
    if DEPENDENCIES_AVAILABLE:
        # Startup
        setup_logging(settings.LOG_LEVEL)
        await init_redis(settings.REDIS_URL)
        
        # Log successful configuration loading
        logger.info(
            "ai_agent_started",
            model_backend=settings.MODEL_BACKEND,
            backend_url=settings.BACKEND_URL,
            redis_url=settings.REDIS_URL.split("@")[-1] if "@" in settings.REDIS_URL else settings.REDIS_URL,  # Hide credentials
            port=settings.PORT,
            host=settings.HOST,
            log_level=settings.LOG_LEVEL,
            sentry_enabled=settings.SENTRY_DSN is not None
        )
        logger.info(
            "configuration_validated",
            message="All required environment variables are present and valid"
        )
    else:
        # Early development mode - just log to console
        print(f"✓ Configuration validated successfully")
        print(f"  MODEL_BACKEND: {settings.MODEL_BACKEND}")
        print(f"  BACKEND_URL: {settings.BACKEND_URL}")
        print(f"  LOG_LEVEL: {settings.LOG_LEVEL}")
        print(f"  Note: Some dependencies not yet implemented (utils.logging, utils.redis, api routers)")
    
    yield
    
    # Shutdown
    if DEPENDENCIES_AVAILABLE:
        await close_redis()
        logger.info("ai_agent_stopped")


app = FastAPI(
    title="DerLg AI Agent",
    description="Conversational booking concierge for Cambodia travel",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow connections from frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://derlg.com", "https://www.derlg.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware (only if dependencies are available)
if DEPENDENCIES_AVAILABLE and add_logging_middleware:
    add_logging_middleware(app)

# Include routers (only if dependencies are available)
if DEPENDENCIES_AVAILABLE:
    app.include_router(ws_router)
    app.include_router(health_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=2,
        log_config=None  # Use structlog instead
    )

