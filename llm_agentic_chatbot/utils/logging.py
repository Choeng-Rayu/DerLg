"""
Structured Logging Configuration for DerLg.com AI Agent

This module configures structlog for structured JSON logging with appropriate
processors and formatters for production use. It provides:
- JSON output for easy parsing and analysis
- Contextual information (timestamps, log levels, logger names)
- Exception formatting with stack traces
- Request ID tracking for distributed tracing
- Sensitive data filtering

Usage:
    from utils.logging import setup_logging
    
    # In main.py startup
    setup_logging("info")
    
    # In application code
    import structlog
    logger = structlog.get_logger()
    logger.info("user_message_received", session_id=session_id, message_length=len(text))
"""

import logging
import sys
from typing import Any, Dict

import structlog
from structlog.types import EventDict, Processor


def add_app_context(logger: Any, method_name: str, event_dict: EventDict) -> EventDict:
    """
    Add application-level context to all log entries.
    
    This processor adds consistent metadata to every log entry:
    - application: Always "ai-agent" for filtering in log aggregation
    - service: Service name for multi-service deployments
    
    Args:
        logger: The logger instance
        method_name: The name of the method being called
        event_dict: The event dictionary to modify
        
    Returns:
        Modified event dictionary with application context
    """
    event_dict["application"] = "ai-agent"
    event_dict["service"] = "derlg-ai-agent"
    return event_dict


def filter_sensitive_data(logger: Any, method_name: str, event_dict: EventDict) -> EventDict:
    """
    Filter sensitive data from log entries.
    
    This processor removes or masks sensitive information to prevent
    accidental logging of:
    - API keys
    - User IDs (masked to last 4 characters)
    - Booking IDs (masked to last 4 characters)
    - Payment intent IDs (masked to last 4 characters)
    
    Args:
        logger: The logger instance
        method_name: The name of the method being called
        event_dict: The event dictionary to modify
        
    Returns:
        Modified event dictionary with sensitive data filtered
    """
    # List of keys that should be completely removed
    sensitive_keys = [
        "api_key",
        "anthropic_api_key",
        "service_key",
        "ai_service_key",
        "password",
        "token",
        "secret",
    ]
    
    # List of keys that should be masked (show last 4 characters only)
    maskable_keys = [
        "user_id",
        "booking_id",
        "payment_intent_id",
        "session_id",
    ]
    
    # Remove sensitive keys
    for key in sensitive_keys:
        if key in event_dict:
            event_dict[key] = "***REDACTED***"
    
    # Mask IDs (show last 4 characters)
    for key in maskable_keys:
        if key in event_dict and isinstance(event_dict[key], str):
            value = event_dict[key]
            if len(value) > 4:
                event_dict[key] = f"****{value[-4:]}"
    
    return event_dict


def setup_logging(log_level: str = "info") -> None:
    """
    Configure structlog for structured JSON logging.
    
    This function sets up structlog with appropriate processors and formatters
    for production use. It configures:
    - JSON output format for easy parsing
    - Timestamp in ISO 8601 format
    - Log level filtering
    - Exception formatting with stack traces
    - Sensitive data filtering
    - Application context injection
    
    The configuration is optimized for production logging systems like
    CloudWatch, Datadog, or ELK stack.
    
    Args:
        log_level: Logging level (debug, info, warning, error, critical)
                  Defaults to "info"
    
    Example:
        >>> setup_logging("debug")
        >>> logger = structlog.get_logger()
        >>> logger.info("server_started", port=8000, host="0.0.0.0")
        {"event": "server_started", "port": 8000, "host": "0.0.0.0", 
         "timestamp": "2024-01-15T10:30:45.123456Z", "level": "info", ...}
    """
    # Convert log level string to logging constant
    log_level_upper = log_level.upper()
    numeric_level = getattr(logging, log_level_upper, logging.INFO)
    
    # Configure standard library logging
    # This ensures that logs from third-party libraries (FastAPI, httpx, etc.)
    # are also captured and formatted consistently
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=numeric_level,
    )
    
    # Configure structlog processors
    # Processors are applied in order to transform log entries
    shared_processors: list[Processor] = [
        # Add log level to event dict
        structlog.stdlib.add_log_level,
        
        # Add logger name to event dict
        structlog.stdlib.add_logger_name,
        
        # Add application context (service name, etc.)
        add_app_context,
        
        # Filter sensitive data before logging
        filter_sensitive_data,
        
        # Add timestamp in ISO 8601 format
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        
        # Add stack info for exceptions
        structlog.processors.StackInfoRenderer(),
        
        # Format exceptions with full stack traces
        structlog.processors.format_exc_info,
        
        # Decode unicode characters
        structlog.processors.UnicodeDecoder(),
    ]
    
    # Configure structlog
    structlog.configure(
        # Processors for all log entries
        processors=shared_processors + [
            # Final processor: render as JSON
            structlog.processors.JSONRenderer()
        ],
        
        # Wrapper class for logger
        wrapper_class=structlog.stdlib.BoundLogger,
        
        # Context class for storing context data
        context_class=dict,
        
        # Logger factory
        logger_factory=structlog.stdlib.LoggerFactory(),
        
        # Cache logger instances for performance
        cache_logger_on_first_use=True,
    )
    
    # Log that logging has been configured
    logger = structlog.get_logger()
    logger.debug(
        "logging_configured",
        log_level=log_level,
        output_format="json",
        processors_count=len(shared_processors) + 1,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """
    Get a structlog logger instance.
    
    This is a convenience function for getting a logger with an optional name.
    The logger will use the configuration set up by setup_logging().
    
    Args:
        name: Optional logger name. If not provided, uses the calling module's name.
              This is useful for identifying which module generated a log entry.
    
    Returns:
        A configured structlog BoundLogger instance
    
    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("processing_message", message_id="123")
    """
    if name:
        return structlog.get_logger(name)
    return structlog.get_logger()


# Example usage and testing
if __name__ == "__main__":
    """
    Test the logging configuration with various log levels and scenarios.
    
    Run this module directly to see example log output:
        python -m utils.logging
    """
    # Setup logging with debug level
    setup_logging("debug")
    
    # Get a logger
    logger = get_logger("test_logger")
    
    # Test different log levels
    logger.debug("debug_message", detail="This is a debug message")
    logger.info("info_message", detail="This is an info message")
    logger.warning("warning_message", detail="This is a warning message")
    logger.error("error_message", detail="This is an error message")
    
    # Test with structured data
    logger.info(
        "user_message_received",
        session_id="550e8400-e29b-41d4-a716-446655440000",
        user_id="user_123456789",
        message_length=42,
        language="EN"
    )
    
    # Test with sensitive data (should be filtered)
    logger.info(
        "api_call",
        api_key="sk-ant-api03-secret-key-here",
        user_id="user_987654321",
        booking_id="booking_123456789"
    )
    
    # Test exception logging
    try:
        raise ValueError("This is a test exception")
    except Exception as e:
        logger.error(
            "exception_occurred",
            exc_info=True,
            error_type=type(e).__name__,
            error_message=str(e)
        )
    
    # Test WebSocket connection logging
    logger.info(
        "websocket_connected",
        session_id="550e8400-e29b-41d4-a716-446655440001",
        user_id="user_111222333",
        remote_addr="192.168.1.100"
    )
    
    # Test tool execution logging
    logger.info(
        "tool_executed",
        tool_name="getTripSuggestions",
        execution_time_ms=245,
        success=True,
        result_count=5
    )
    
    # Test model API call logging
    logger.info(
        "model_api_call",
        model="claude-sonnet-4-5-20251001",
        input_tokens=1234,
        output_tokens=567,
        latency_ms=1850,
        stop_reason="end_turn"
    )
    
    print("\n✓ Logging configuration test completed")
    print("All log entries above should be in JSON format with timestamps")
