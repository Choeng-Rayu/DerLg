"""
Integration Tests for Request Logging Middleware

Tests the middleware in a realistic FastAPI application context with
actual HTTP requests and response handling.
"""

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from unittest.mock import patch
import structlog

from api.middleware import add_logging_middleware
from utils.logging import setup_logging


@pytest.fixture(scope="module")
def app():
    """Create a test FastAPI application with logging middleware"""
    # Setup logging
    setup_logging("debug")
    
    # Create app
    app = FastAPI(title="Test App")
    
    # Add logging middleware
    add_logging_middleware(app)
    
    # Add test endpoints
    @app.get("/")
    async def root():
        return {"message": "Hello World"}
    
    @app.get("/users/{user_id}")
    async def get_user(user_id: int):
        return {"user_id": user_id, "name": f"User {user_id}"}
    
    @app.post("/users")
    async def create_user(name: str):
        return {"id": 123, "name": name}
    
    @app.get("/error/500")
    async def internal_error():
        raise Exception("Internal server error")
    
    @app.get("/error/404")
    async def not_found():
        raise HTTPException(status_code=404, detail="Not found")
    
    return app


@pytest.fixture
def client(app):
    """Create a test client"""
    return TestClient(app)


def test_get_request_logging(client):
    """Test logging for GET requests"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/")
        
        assert response.status_code == 200
        assert response.json() == {"message": "Hello World"}
        
        # Verify logging calls
        assert mock_logger.info.call_count == 2  # request_started + request_completed
        
        # Check request_started
        started_call = mock_logger.info.call_args_list[0]
        assert started_call[0][0] == "request_started"
        assert started_call[1]["method"] == "GET"
        assert started_call[1]["path"] == "/"
        
        # Check request_completed
        completed_call = mock_logger.info.call_args_list[1]
        assert completed_call[0][0] == "request_completed"
        assert completed_call[1]["status_code"] == 200


def test_post_request_logging(client):
    """Test logging for POST requests"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.post("/users?name=John")
        
        assert response.status_code == 200
        
        # Verify POST method is logged
        started_call = mock_logger.info.call_args_list[0]
        assert started_call[1]["method"] == "POST"
        assert started_call[1]["path"] == "/users"


def test_path_parameters_logging(client):
    """Test logging for requests with path parameters"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/users/42")
        
        assert response.status_code == 200
        assert response.json()["user_id"] == 42
        
        # Verify path is logged correctly
        started_call = mock_logger.info.call_args_list[0]
        assert started_call[1]["path"] == "/users/42"


def test_query_parameters_logging(client):
    """Test logging for requests with query parameters"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/?search=test&limit=10")
        
        # Verify query params are logged
        started_call = mock_logger.info.call_args_list[0]
        query_params = started_call[1]["query_params"]
        assert "search=test" in query_params
        assert "limit=10" in query_params


def test_http_exception_logging(client):
    """Test logging for HTTP exceptions (404, etc.)"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/error/404")
        
        assert response.status_code == 404
        
        # HTTP exceptions should still complete normally (not logged as errors)
        assert mock_logger.info.call_count == 2
        completed_call = mock_logger.info.call_args_list[1]
        assert completed_call[1]["status_code"] == 404


def test_internal_error_logging(client):
    """Test logging for internal server errors"""
    with patch('api.middleware.logger') as mock_logger:
        with pytest.raises(Exception):
            client.get("/error/500")
        
        # Verify error was logged
        assert mock_logger.error.call_count == 1
        error_call = mock_logger.error.call_args_list[0]
        assert error_call[0][0] == "request_failed"
        assert error_call[1]["error_type"] == "Exception"
        assert "Internal server error" in error_call[1]["error_message"]


def test_request_id_consistency(client):
    """Test that request ID is consistent across the request lifecycle"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/")
        
        # Get request IDs from logs
        started_id = mock_logger.info.call_args_list[0][1]["request_id"]
        completed_id = mock_logger.info.call_args_list[1][1]["request_id"]
        header_id = response.headers["X-Request-ID"]
        
        # All should match
        assert started_id == completed_id == header_id


def test_multiple_requests_different_ids(client):
    """Test that different requests get different request IDs"""
    request_ids = []
    
    for _ in range(3):
        response = client.get("/")
        request_ids.append(response.headers["X-Request-ID"])
    
    # All request IDs should be unique
    assert len(set(request_ids)) == 3


def test_duration_measurement(client):
    """Test that request duration is measured and logged"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get("/")
        
        completed_call = mock_logger.info.call_args_list[1]
        duration_ms = completed_call[1]["duration_ms"]
        
        # Duration should be a positive number
        assert isinstance(duration_ms, (int, float))
        assert duration_ms >= 0
        assert duration_ms < 10000  # Should be less than 10 seconds


def test_custom_headers_logged(client):
    """Test that custom headers like User-Agent are logged"""
    with patch('api.middleware.logger') as mock_logger:
        response = client.get(
            "/",
            headers={
                "User-Agent": "Mozilla/5.0 Test Browser",
                "X-Custom-Header": "custom-value"
            }
        )
        
        started_call = mock_logger.info.call_args_list[0]
        assert started_call[1]["user_agent"] == "Mozilla/5.0 Test Browser"


def test_concurrent_requests(client):
    """Test that middleware handles concurrent requests correctly"""
    import concurrent.futures
    
    def make_request(path):
        response = client.get(path)
        return response.headers["X-Request-ID"]
    
    # Make multiple concurrent requests
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(make_request, f"/users/{i}")
            for i in range(10)
        ]
        request_ids = [f.result() for f in futures]
    
    # All request IDs should be unique
    assert len(set(request_ids)) == 10


if __name__ == "__main__":
    """Run integration tests"""
    pytest.main([__file__, "-v", "-s"])
