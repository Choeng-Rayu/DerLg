import re
import structlog

logger = structlog.get_logger(__name__)

def sanitize_user_input(text: str, max_length: int = 4096) -> str:
    """Sanitize user input to prevent injection attacks."""
    if not isinstance(text, str):
        return ""

    # Truncate to max length
    text = text[:max_length]

    # Remove null bytes
    text = text.replace("\x00", "")

    # Remove control characters (except newlines and tabs)
    text = re.sub(r'[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    return text.strip()


def validate_tool_input(tool_name: str, tool_input: dict) -> dict:
    """Validate and sanitize tool inputs before making backend calls."""
    if not isinstance(tool_input, dict):
        return {}

    sanitized = {}
    for key, value in tool_input.items():
        if isinstance(value, str):
            # Sanitize string values
            sanitized[key] = sanitize_user_input(value, max_length=1024)
        elif isinstance(value, (int, float, bool)):
            sanitized[key] = value
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_user_input(v, max_length=1024) if isinstance(v, str) else v
                for v in value
            ]
        elif isinstance(value, dict):
            sanitized[key] = validate_tool_input(tool_name, value)
        else:
            sanitized[key] = value

    return sanitized
