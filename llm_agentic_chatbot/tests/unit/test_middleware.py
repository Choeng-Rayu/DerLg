"""
Unit Tests for Request Logging Middleware

Tests the RequestLoggingMiddleware functionality including:
- Request logging with all required fields
- Response logging with status codes and duration
- Request ID generation and header injection
- Error handling and logging
- Integration with FastAPI application
"""

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
import structlog
from unittest.mock import Mock, patch, ANY

from api.middleware import RequestLoggingMiddleware, add_logging_middleware


@pytest.fixture
def app():
    """Create a test FastAPI application with logging middleware"""
    app = FastAPI()
    add_logging_middleware(app)
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.get("/error")
    async def error_endpoint():
        raise ValueError("Test error")
    
    return app


@pytest.fixture
def client(app):
    """Create a test client for the FastAPI application"""
    return TestClient(app)


def test_middleware_logs_successful_request(client, caplog):
    """Test that middleware logs successful requests with all required fields"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/test")
        
        # Verify response is successful
        assert response.status_code == 200
        assert response.json() == {"message": "success"}
        
        # Verify request_started was logged
        request_started_call = mock_logger.info.call_args_list[0]
        assert request_started_call[0][0] == "request_started"
        request_started_kwargs = request_started_call[1]
        assert request_started_kwargs["method"] == "GET"
        assert request_started_kwargs["path"] == "/test"
        assert "request_id" in request_started_kwargs
        assert "client_host" in request_started_kwargs
        
        # Verify request_completed was logged
        request_completed_call = mock_logger.info.call_args_list[1]
        assert request_completed_call[0][0] == "request_completed"
        request_completed_kwargs = request_completed_call[1]
        assert request_completed_kwargs["method"] == "GET"
        assert request_completed_kwargs["path"] == "/test"
        assert request_completed_kwargs["status_code"] == 200
        assert "duration_ms" in request_completed_kwargs
        assert request_completed_kwargs["duration_ms"] >= 0


def test_middleware_adds_request_id_header(client):
    """Test that middleware adds X-Request-ID header to response"""
    response = client.get("/test")
    
    # Verify X-Request-ID header is present
    assert "X-Request-ID" in response.headers
    
    # Verify it's a valid UUID format
    request_id = response.headers["X-Request-ID"]
    assert len(request_id) == 36  # UUID format: 8-4-4-4-12
    assert request_id.count("-") == 4


def test_middleware_logs_request_with_query_params(client):
    """Test that middleware logs query parameters"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/test?foo=bar&baz=qux")
        
        # Verify request_started includes query params
        request_started_call = mock_logger.info.call_args_list[0]
        request_started_kwargs = request_started_call[1]
        assert "query_params" in request_started_kwargs
        assert "foo=bar" in request_started_kwargs["query_params"]
        assert "baz=qux" in request_started_kwargs["query_params"]


def test_middleware_logs_user_agent(client):
    """Test that middleware logs User-Agent header"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/test", headers={"User-Agent": "TestClient/1.0"})
        
        # Verify request_started includes user_agent
        request_started_call = mock_logger.info.call_args_list[0]
        request_started_kwargs = request_started_call[1]
        assert request_started_kwargs["user_agent"] == "TestClient/1.0"


def test_middleware_logs_error_requests(client):
    """Test that middleware logs failed requests with error details"""
    with patch('api.middleware.logger') as mock_logger:
        # Make request that will raise an error
        with pytest.raises(ValueError):
            client.get("/error")
        
        # Verify request_started was logged
        assert mock_logger.info.call_count >= 1
        request_started_call = mock_logger.info.call_args_list[0]
        assert request_started_call[0][0] == "request_started"
        
        # Verify request_failed was logged
        assert mock_logger.error.call_count == 1
        request_failed_call = mock_logger.error.call_args_list[0]
        assert request_failed_call[0][0] == "request_failed"
        request_failed_kwargs = request_failed_call[1]
        assert request_failed_kwargs["method"] == "GET"
        assert request_failed_kwargs["path"] == "/error"
        assert request_failed_kwargs["error_type"] == "ValueError"
        assert request_failed_kwargs["error_message"] == "Test error"
        assert "duration_ms" in request_failed_kwargs
        assert request_failed_kwargs["exc_info"] is True


def test_middleware_measures_duration(client):
    """Test that middleware accurately measures request duration"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/test")
        
        # Get duration from log
        request_completed_call = mock_logger.info.call_args_list[1]
        request_completed_kwargs = request_completed_call[1]
        duration_ms = request_completed_kwargs["duration_ms"]
        
        # Verify duration is reasonable (should be very fast for test endpoint)
        assert duration_ms >= 0
        assert duration_ms < 1000  # Should complete in less than 1 second


def test_middleware_preserves_request_id_across_logs(client):
    """Test that the same request_id is used for request_started and request_completed"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/test")
        
        # Get request_id from both log calls
        request_started_call = mock_logger.info.call_args_list[0]
        request_completed_call = mock_logger.info.call_args_list[1]
        
        request_id_started = request_started_call[1]["request_id"]
        request_id_completed = request_completed_call[1]["request_id"]
        
        # Verify they match
        assert request_id_started == request_id_completed
        
        # Verify it matches the response header
        assert response.headers["X-Request-ID"] == request_id_started


def test_add_logging_middleware_function():
    """Test that add_logging_middleware correctly adds middleware to app"""
    app = FastAPI()
    
    # Verify no middleware initially
    initial_middleware_count = len(app.user_middleware)
    
    # Add logging middleware
    with patch('api.middleware.logger') as mock_logger:
        add_logging_middleware(app)
        
        # Verify middleware was added
        assert len(app.user_middleware) == initial_middleware_count + 1
        
        # Verify debug log was emitted
        mock_logger.debug.assert_called_once_with(
            "logging_middleware_added",
            message="Request logging middleware registered"
        )


def test_middleware_handles_missing_client_info(app):
    """Test that middleware handles requests without client information gracefully"""
    # Create a mock request without client info
    from starlette.datastructures import URL
    
    mock_request = Mock(spec=Request)
    mock_request.method = "GET"
    mock_request.url = URL("http://testserver/test")
    mock_request.client = None  # No client info
    mock_request.headers = {}
    mock_request.state = Mock()
    
    middleware = RequestLoggingMiddleware(app)
    
    # Create a simple call_next function
    async def call_next(request):
        from fastapi import Response
        return Response(content="OK", status_code=200)
    
    # This should not raise an error
    with patch('api.middleware.logger') as mock_logger:
        import asyncio
        response = asyncio.run(middleware.dispatch(mock_request, call_next))
        
        # Verify request was logged with None for client_host
        request_started_call = mock_logger.info.call_args_list[0]
        request_started_kwargs = request_started_call[1]
        assert request_started_kwargs["client_host"] is None


def test_middleware_handles_no_query_params(client):
    """Test that middleware handles requests without query parameters"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/test")
        
        # Verify request_started logs None for query_params
        request_started_call = mock_logger.info.call_args_list[0]
        request_started_kwargs = request_started_call[1]
        assert request_started_kwargs["query_params"] is None


@pytest.mark.asyncio
async def test_middleware_integration_with_fastapi():
    """Integration test: Verify middleware works with actual FastAPI application"""
    from utils.logging import setup_logging
    
    # Setup logging
    setup_logging("debug")
    
    # Create app with middleware
    app = FastAPI()
    add_logging_middleware(app)
    
    @app.get("/integration-test")
    async def integration_endpoint():
        return {"status": "ok"}
    
    # Create test client
    client = TestClient(app)
    
    # Make request
    response = client.get("/integration-test")
    
    # Verify response
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert "X-Request-ID" in response.headers


if __name__ == "__main__":
    """Run tests with pytest"""
    pytest.main([__file__, "-v"])
