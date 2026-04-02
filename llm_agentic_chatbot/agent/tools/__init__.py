"""Tool system for backend API integration.

Public API:
    ToolExecutor  -- orchestrates parallel tool execution
    TOOL_DISPATCH -- maps tool names to handler functions
"""

from agent.tools.executor import ToolExecutor
from agent.tools.handlers import TOOL_DISPATCH

__all__ = ["ToolExecutor", "TOOL_DISPATCH"]
