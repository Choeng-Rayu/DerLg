"""
Request Logging Middleware for DerLg.com AI Agent

This module implements FastAPI middleware for logging all HTTP and WebSocket requests.
It provides:
- Request/response logging with timing information
- Structured logging using structlog
- Request ID tracking for distributed tracing
- Status code and error tracking

Usage:
    from api.middleware import add_logging_middleware
    
    # In main.py
    add_logging_middleware(app)
"""

import time
import uuid
from typing import Callable

import structlog
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


logger = structlog.get_logger()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs all incoming HTTP requests and their responses.
    
    This middleware:
    - Generates a unique request_id for each request
    - Logs request details (method, path, client IP)
    - Measures request duration
    - Logs response details (status code, duration)
    - Handles exceptions and logs errors
    
    The request_id is added to the request state and can be accessed
    by downstream handlers for correlation.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process each request and log details.
        
        Args:
            request: The incoming HTTP request
            call_next: The next middleware or route handler
            
        Returns:
            The HTTP response from the route handler
        """
        # Generate unique request ID for tracing
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Extract request details
        method = request.method
        path = request.url.path
        query_params = str(request.url.query) if request.url.query else None
        client_host = request.client.host if request.client else None
        
        # Log incoming request
        logger.info(
            "request_started",
            request_id=request_id,
            method=method,
            path=path,
            query_params=query_params,
            client_host=client_host,
            user_agent=request.headers.get("user-agent"),
        )
        
        # Record start time
        start_time = time.time()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log successful response
            logger.info(
                "request_completed",
                request_id=request_id,
                method=method,
                path=path,
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2),
            )
            
            # Add request ID to response headers for client-side tracing
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as exc:
            # Calculate duration even for failed requests
            duration_ms = (time.time() - start_time) * 1000
            
            # Log error
            logger.error(
                "request_failed",
                request_id=request_id,
                method=method,
                path=path,
                duration_ms=round(duration_ms, 2),
                error_type=type(exc).__name__,
                error_message=str(exc),
                exc_info=True,
            )
            
            # Re-raise exception to be handled by FastAPI's exception handlers
            raise


def add_logging_middleware(app: FastAPI) -> None:
    """
    Add request logging middleware to the FastAPI application.
    
    This function should be called during application initialization
    to enable request/response logging for all endpoints.
    
    Args:
        app: The FastAPI application instance
        
    Example:
        >>> from fastapi import FastAPI
        >>> from api.middleware import add_logging_middleware
        >>> 
        >>> app = FastAPI()
        >>> add_logging_middleware(app)
    """
    app.add_middleware(RequestLoggingMiddleware)
    logger.debug("logging_middleware_added", message="Request logging middleware registered")


# Example usage and testing
if __name__ == "__main__":
    """
    Test the logging middleware with a simple FastAPI application.
    
    Run this module directly to see example log output:
        python -m api.middleware
    """
    from fastapi import FastAPI
    from utils.logging import setup_logging
    
    # Setup logging
    setup_logging("debug")
    
    # Create test app
    app = FastAPI()
    
    # Add logging middleware
    add_logging_middleware(app)
    
    # Add test endpoint
    @app.get("/test")
    async def test_endpoint():
        return {"message": "Test successful"}
    
    @app.get("/error")
    async def error_endpoint():
        raise ValueError("Test error")
    
    print("\n✓ Logging middleware configured")
    print("Start the server with: uvicorn api.middleware:app --reload")
    print("Test endpoints:")
    print("  - GET http://localhost:8000/test (success)")
    print("  - GET http://localhost:8000/error (error)")
