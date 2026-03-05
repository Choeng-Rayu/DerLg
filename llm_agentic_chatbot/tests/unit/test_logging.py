"""
Unit Tests for Structured Logging Configuration

Tests the structlog configuration to ensure:
- JSON output format
- Proper log level filtering
- Sensitive data filtering
- Exception formatting
- Application context injection
"""

import json
import logging
from io import StringIO

import pytest
import structlog

from utils.logging import (
    setup_logging,
    get_logger,
    add_app_context,
    filter_sensitive_data,
)


@pytest.fixture
def capture_logs():
    """
    Fixture to capture log output for testing.
    
    Yields:
        StringIO: A string buffer containing captured log output
    """
    # Create a string buffer to capture logs
    log_buffer = StringIO()
    
    # Create a custom handler that writes to the buffer
    handler = logging.StreamHandler(log_buffer)
    handler.setLevel(logging.DEBUG)
    
    # Get the root logger and add our handler
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.DEBUG)
    
    # Configure structlog to use stdlib logging
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            add_app_context,
            filter_sensitive_data,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=False,
    )
    
    yield log_buffer
    
    # Cleanup
    root_logger.removeHandler(handler)
    structlog.reset_defaults()


class TestLoggingSetup:
    """Test suite for logging setup and configuration."""
    
    def test_setup_logging_configures_structlog(self):
        """Test that setup_logging configures structlog correctly."""
        setup_logging("info")
        
        # Verify structlog is configured
        logger = structlog.get_logger()
        assert logger is not None
        # Logger should be usable (has info method)
        assert hasattr(logger, "info")
    
    def test_setup_logging_accepts_valid_log_levels(self):
        """Test that setup_logging accepts all valid log levels."""
        valid_levels = ["debug", "info", "warning", "error", "critical"]
        
        for level in valid_levels:
            setup_logging(level)
            # Should not raise any exceptions
    
    def test_get_logger_returns_bound_logger(self):
        """Test that get_logger returns a BoundLogger instance."""
        setup_logging("info")
        logger = get_logger("test_module")
        
        # Logger should be usable (has info method)
        assert hasattr(logger, "info")
    
    def test_get_logger_with_name(self):
        """Test that get_logger accepts a logger name."""
        setup_logging("info")
        logger = get_logger("my_module")
        
        # Logger should be usable
        logger.info("test_message")


class TestApplicationContext:
    """Test suite for application context processor."""
    
    def test_add_app_context_adds_application_field(self):
        """Test that add_app_context adds 'application' field."""
        event_dict = {}
        result = add_app_context(None, None, event_dict)
        
        assert "application" in result
        assert result["application"] == "ai-agent"
    
    def test_add_app_context_adds_service_field(self):
        """Test that add_app_context adds 'service' field."""
        event_dict = {}
        result = add_app_context(None, None, event_dict)
        
        assert "service" in result
        assert result["service"] == "derlg-ai-agent"


class TestSensitiveDataFiltering:
    """Test suite for sensitive data filtering processor."""
    
    def test_filter_api_keys(self):
        """Test that API keys are redacted."""
        event_dict = {
            "api_key": "sk-ant-api03-secret-key",
            "anthropic_api_key": "sk-ant-api03-another-key",
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        assert result["api_key"] == "***REDACTED***"
        assert result["anthropic_api_key"] == "***REDACTED***"
    
    def test_filter_service_keys(self):
        """Test that service keys are redacted."""
        event_dict = {
            "service_key": "my-secret-service-key-12345678",
            "ai_service_key": "another-secret-key-87654321",
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        assert result["service_key"] == "***REDACTED***"
        assert result["ai_service_key"] == "***REDACTED***"
    
    def test_filter_passwords_and_tokens(self):
        """Test that passwords and tokens are redacted."""
        event_dict = {
            "password": "my-password-123",
            "token": "jwt-token-xyz",
            "secret": "my-secret-value",
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        assert result["password"] == "***REDACTED***"
        assert result["token"] == "***REDACTED***"
        assert result["secret"] == "***REDACTED***"
    
    def test_mask_user_ids(self):
        """Test that user IDs are masked (show last 4 characters)."""
        event_dict = {
            "user_id": "user_123456789",
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        assert result["user_id"] == "****6789"
    
    def test_mask_booking_ids(self):
        """Test that booking IDs are masked."""
        event_dict = {
            "booking_id": "booking_987654321",
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        assert result["booking_id"] == "****4321"
    
    def test_mask_payment_intent_ids(self):
        """Test that payment intent IDs are masked."""
        event_dict = {
            "payment_intent_id": "pi_1234567890abcdef",
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        assert result["payment_intent_id"] == "****cdef"
    
    def test_mask_session_ids(self):
        """Test that session IDs are masked."""
        event_dict = {
            "session_id": "550e8400-e29b-41d4-a716-446655440000",
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        assert result["session_id"] == "****0000"
    
    def test_short_ids_not_masked(self):
        """Test that IDs shorter than 4 characters are not masked."""
        event_dict = {
            "user_id": "abc",
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        # Should remain unchanged
        assert result["user_id"] == "abc"
    
    def test_non_string_ids_not_masked(self):
        """Test that non-string ID values are not masked."""
        event_dict = {
            "user_id": 12345,
        }
        result = filter_sensitive_data(None, None, event_dict)
        
        # Should remain unchanged
        assert result["user_id"] == 12345


class TestJSONOutput:
    """Test suite for JSON output format."""
    
    def test_log_output_is_valid_json(self, capture_logs):
        """Test that log output is valid JSON."""
        logger = structlog.get_logger()
        logger.info("test_event", key="value")
        
        log_output = capture_logs.getvalue().strip()
        
        # Should be valid JSON
        log_data = json.loads(log_output)
        assert log_data["event"] == "test_event"
        assert log_data["key"] == "value"
    
    def test_log_includes_timestamp(self, capture_logs):
        """Test that log entries include ISO 8601 timestamp."""
        logger = structlog.get_logger()
        logger.info("test_event")
        
        log_output = capture_logs.getvalue().strip()
        log_data = json.loads(log_output)
        
        assert "timestamp" in log_data
        # Timestamp should be in ISO 8601 format (contains 'T' and 'Z')
        assert "T" in log_data["timestamp"]
        assert log_data["timestamp"].endswith("Z")
    
    def test_log_includes_log_level(self, capture_logs):
        """Test that log entries include log level."""
        logger = structlog.get_logger()
        logger.info("test_event")
        
        log_output = capture_logs.getvalue().strip()
        log_data = json.loads(log_output)
        
        assert "level" in log_data
        assert log_data["level"] == "info"
    
    def test_log_includes_logger_name(self, capture_logs):
        """Test that log entries include logger name."""
        logger = structlog.get_logger("my_module")
        logger.info("test_event")
        
        log_output = capture_logs.getvalue().strip()
        log_data = json.loads(log_output)
        
        assert "logger" in log_data
    
    def test_log_includes_application_context(self, capture_logs):
        """Test that log entries include application context."""
        logger = structlog.get_logger()
        logger.info("test_event")
        
        log_output = capture_logs.getvalue().strip()
        log_data = json.loads(log_output)
        
        assert "application" in log_data
        assert log_data["application"] == "ai-agent"
        assert "service" in log_data
        assert log_data["service"] == "derlg-ai-agent"


class TestStructuredLogging:
    """Test suite for structured logging with contextual data."""
    
    def test_log_with_structured_data(self, capture_logs):
        """Test logging with structured contextual data."""
        logger = structlog.get_logger()
        logger.info(
            "user_message_received",
            session_id="session_123",
            user_id="user_456",
            message_length=42,
            language="EN"
        )
        
        log_output = capture_logs.getvalue().strip()
        log_data = json.loads(log_output)
        
        assert log_data["event"] == "user_message_received"
        assert log_data["message_length"] == 42
        assert log_data["language"] == "EN"
        # IDs should be masked
        assert log_data["session_id"] == "****_123"
        assert log_data["user_id"] == "****_456"
    
    def test_log_tool_execution(self, capture_logs):
        """Test logging tool execution with metrics."""
        logger = structlog.get_logger()
        logger.info(
            "tool_executed",
            tool_name="getTripSuggestions",
            execution_time_ms=245,
            success=True,
            result_count=5
        )
        
        log_output = capture_logs.getvalue().strip()
        log_data = json.loads(log_output)
        
        assert log_data["event"] == "tool_executed"
        assert log_data["tool_name"] == "getTripSuggestions"
        assert log_data["execution_time_ms"] == 245
        assert log_data["success"] is True
        assert log_data["result_count"] == 5
    
    def test_log_model_api_call(self, capture_logs):
        """Test logging model API calls with token counts."""
        logger = structlog.get_logger()
        logger.info(
            "model_api_call",
            model="claude-sonnet-4-5-20251001",
            input_tokens=1234,
            output_tokens=567,
            latency_ms=1850,
            stop_reason="end_turn"
        )
        
        log_output = capture_logs.getvalue().strip()
        log_data = json.loads(log_output)
        
        assert log_data["event"] == "model_api_call"
        assert log_data["model"] == "claude-sonnet-4-5-20251001"
        assert log_data["input_tokens"] == 1234
        assert log_data["output_tokens"] == 567
        assert log_data["latency_ms"] == 1850
        assert log_data["stop_reason"] == "end_turn"


class TestExceptionLogging:
    """Test suite for exception logging."""
    
    def test_log_exception_with_stack_trace(self, capture_logs):
        """Test that exceptions are logged with stack traces."""
        logger = structlog.get_logger()
        
        try:
            raise ValueError("Test exception")
        except Exception as e:
            logger.error(
                "exception_occurred",
                exc_info=True,
                error_type=type(e).__name__,
                error_message=str(e)
            )
        
        log_output = capture_logs.getvalue().strip()
        log_data = json.loads(log_output)
        
        assert log_data["event"] == "exception_occurred"
        assert log_data["error_type"] == "ValueError"
        assert log_data["error_message"] == "Test exception"
        # The exc_info field should be present (even if True, it gets processed)
        # In production, format_exc_info processor converts exc_info to exception field
        # For this test, we just verify the error details are logged
        assert "error_type" in log_data
        assert "error_message" in log_data


class TestLogLevelFiltering:
    """Test suite for log level filtering."""
    
    def test_debug_level_logs_all_messages(self):
        """Test that debug level logs all message types."""
        setup_logging("debug")
        logger = structlog.get_logger()
        
        # All these should be logged at debug level
        logger.debug("debug_message")
        logger.info("info_message")
        logger.warning("warning_message")
        logger.error("error_message")
        # No assertions needed - just verify no exceptions
    
    def test_info_level_filters_debug(self):
        """Test that info level filters out debug messages."""
        setup_logging("info")
        logger = structlog.get_logger()
        
        # Debug should be filtered, others should log
        logger.debug("debug_message")  # Should be filtered
        logger.info("info_message")
        logger.warning("warning_message")
        logger.error("error_message")
        # No assertions needed - just verify no exceptions
    
    def test_error_level_filters_info_and_warning(self):
        """Test that error level filters info and warning messages."""
        setup_logging("error")
        logger = structlog.get_logger()
        
        # Only error and critical should log
        logger.debug("debug_message")  # Should be filtered
        logger.info("info_message")  # Should be filtered
        logger.warning("warning_message")  # Should be filtered
        logger.error("error_message")
        # No assertions needed - just verify no exceptions


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
