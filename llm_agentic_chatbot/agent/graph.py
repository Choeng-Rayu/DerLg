"""LangGraph state machine for the DerLg AI Agent conversation flow.

Defines a three-node graph:
    call_llm  ──(tool_use)──▸  execute_tools ──▸ call_llm  (loop)
    call_llm  ──(end_turn)──▸  format_response ──▸ END

The graph is compiled once at module level and reused for every turn via
``run_agent_graph``.  After each completed turn the session is
checkpointed to Redis via :class:`~agent.checkpointer.RedisCheckpointer`
so conversations can be resumed across reconnects.
"""

from __future__ import annotations

import json
from typing import Any, TypedDict

import structlog

from langgraph.graph import StateGraph, END

from agent.checkpointer import RedisCheckpointer
from agent.formatters.formatter import format_response
from agent.models import get_model_client
from agent.models.client import ModelResponse
from agent.prompts.builder import build_system_prompt
from agent.session.side_effects import apply_session_side_effects
from agent.session.state import ConversationState
from agent.tools.executor import ToolExecutor
from agent.tools.schemas import ALL_TOOLS
from utils.redis import get_redis_client

logger = structlog.get_logger(__name__)

MAX_TOOL_LOOPS = 5
MAX_TOKENS = 2048
MESSAGE_WINDOW = 20


# ---------------------------------------------------------------------------
# Graph state
# ---------------------------------------------------------------------------

class GraphState(TypedDict):
    """Typed state passed between LangGraph nodes."""

    session: ConversationState
    response: ModelResponse | None
    tool_results_collected: list[dict[str, Any]]
    formatted_output: dict[str, Any] | None
    loop_count: int


# ---------------------------------------------------------------------------
# Node functions
# ---------------------------------------------------------------------------

async def call_llm(state: GraphState) -> dict[str, Any]:
    """Send the current conversation to the LLM and store its response."""
    session: ConversationState = state["session"]
    client = get_model_client(session.preferred_language)
    system_prompt = build_system_prompt(session)

    recent_messages = session.messages[-MESSAGE_WINDOW:]

    logger.info(
        "graph_call_llm",
        loop=state["loop_count"],
        message_count=len(recent_messages),
        state=session.state,
    )

    response: ModelResponse = await client.create_message(
        system=system_prompt,
        messages=recent_messages,
        tools=ALL_TOOLS,
        max_tokens=MAX_TOKENS,
    )

    return {"response": response}


async def execute_tools(state: GraphState) -> dict[str, Any]:
    """Execute every tool_use block returned by the LLM."""
    session: ConversationState = state["session"]
    response: ModelResponse = state["response"]  # type: ignore[assignment]
    tool_results_collected: list[dict[str, Any]] = list(state["tool_results_collected"])

    # Build assistant content and isolate tool calls
    assistant_content: list[dict[str, Any]] = []
    tool_calls: list[dict[str, Any]] = []

    for block in response.content:
        if block.type == "text" and block.text:
            assistant_content.append({"type": "text", "text": block.text})
        elif block.type == "tool_use":
            tool_call = {
                "type": "tool_use",
                "id": block.id,
                "name": block.name,
                "input": block.input or {},
            }
            assistant_content.append(tool_call)
            tool_calls.append(tool_call)

    # Record assistant message in conversation history
    session.messages.append({"role": "assistant", "content": assistant_content})

    # Run tools in parallel
    executor = ToolExecutor()
    results = await executor.execute_tools_parallel(
        tool_calls, session.preferred_language
    )

    # Apply side-effects and append tool results to messages
    for result in results:
        tool_use_id = result["tool_use_id"]
        tool_name = next(
            (tc["name"] for tc in tool_calls if tc["id"] == tool_use_id),
            None,
        )
        if tool_name:
            try:
                parsed = (
                    json.loads(result["content"])
                    if isinstance(result["content"], str)
                    else result["content"]
                )
            except (json.JSONDecodeError, TypeError):
                parsed = {}
            apply_session_side_effects(session, tool_name, parsed)

        session.messages.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": result["tool_use_id"],
                        "content": result["content"],
                    }
                ],
            }
        )
        tool_results_collected.append(result)

    return {
        "tool_results_collected": tool_results_collected,
        "loop_count": state["loop_count"] + 1,
    }


async def format_response_node(state: GraphState) -> dict[str, Any]:
    """Extract final text from the LLM and produce a frontend-ready message."""
    session: ConversationState = state["session"]
    response: ModelResponse = state["response"]  # type: ignore[assignment]
    tool_results_collected: list[dict[str, Any]] = state["tool_results_collected"]

    ai_text = ""
    for block in response.content:
        if block.type == "text" and block.text:
            ai_text += block.text

    # Record the final assistant message
    session.messages.append(
        {"role": "assistant", "content": [{"type": "text", "text": ai_text}]}
    )

    formatted = format_response(ai_text, tool_results_collected, session)

    logger.info(
        "graph_turn_complete",
        state=session.state,
        tool_calls=len(tool_results_collected),
        response_type=formatted.get("type", "text"),
    )

    return {"formatted_output": formatted}


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------

def route_after_llm(state: GraphState) -> str:
    """Decide the next node based on the LLM stop_reason and loop count."""
    response = state.get("response")
    if (
        response is not None
        and response.stop_reason == "tool_use"
        and state["loop_count"] < MAX_TOOL_LOOPS
    ):
        return "execute_tools"
    return "format_response"


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def build_agent_graph() -> Any:
    """Build and compile the LangGraph state machine.

    Returns a compiled graph that can be invoked with ``ainvoke``.
    """
    graph = StateGraph(GraphState)

    # Nodes
    graph.add_node("call_llm", call_llm)
    graph.add_node("execute_tools", execute_tools)
    graph.add_node("format_response", format_response_node)

    # Entry point
    graph.set_entry_point("call_llm")

    # Edges
    graph.add_conditional_edges(
        "call_llm",
        route_after_llm,
        {
            "execute_tools": "execute_tools",
            "format_response": "format_response",
        },
    )
    graph.add_edge("execute_tools", "call_llm")
    graph.add_edge("format_response", END)

    return graph.compile()


# Compiled graph singleton — reused across all invocations
agent_graph = build_agent_graph()


# ---------------------------------------------------------------------------
# Checkpointer helper
# ---------------------------------------------------------------------------

def _get_checkpointer() -> RedisCheckpointer:
    """Return a ``RedisCheckpointer`` backed by the current Redis client.

    If Redis is unavailable the checkpointer still works -- its methods
    degrade gracefully (saves become no-ops, loads return ``None``).
    """
    return RedisCheckpointer(get_redis_client())


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def run_agent_graph(
    session: ConversationState,
    user_text: str,
    *,
    checkpointer: RedisCheckpointer | None = None,
) -> dict[str, Any]:
    """Execute one conversation turn using the LangGraph state machine.

    This is the graph-based equivalent of ``run_agent()`` in ``agent/core.py``.
    After the graph finishes, the mutated ``session`` is persisted to Redis
    so the conversation can be resumed later.

    Args:
        session: Current conversation state (mutated in-place).
        user_text: The user's message text.
        checkpointer: Optional explicit checkpointer instance.  When
            ``None`` the default Redis-backed checkpointer is used.

    Returns:
        Formatted response dict ready to send over WebSocket.
    """
    if checkpointer is None:
        checkpointer = _get_checkpointer()

    # Append user message
    session.messages.append(
        {"role": "user", "content": [{"type": "text", "text": user_text}]}
    )

    initial_state: GraphState = {
        "session": session,
        "response": None,
        "tool_results_collected": [],
        "formatted_output": None,
        "loop_count": 0,
    }

    result = await agent_graph.ainvoke(initial_state)

    # Determine the next step number for this session
    current_step = await checkpointer.get_step_count(session.session_id)
    next_step = current_step + 1

    if result.get("formatted_output"):
        # Persist checkpoint after a successful turn
        await checkpointer.save(session, step=next_step)
        return result["formatted_output"]

    # Fallback when graph produces no formatted output
    fallback = "I apologize, something went wrong. Could you try again?"
    session.messages.append(
        {"role": "assistant", "content": [{"type": "text", "text": fallback}]}
    )
    # Still checkpoint -- the session carries valuable context
    await checkpointer.save(session, step=next_step)
    return {"type": "text", "content": fallback}


async def load_session_checkpoint(
    session_id: str,
    *,
    checkpointer: RedisCheckpointer | None = None,
) -> tuple[ConversationState | None, int]:
    """Load the latest checkpoint for a session, enabling resumption.

    This is the counterpart to the save that happens inside
    ``run_agent_graph``.

    Args:
        session_id: The session whose checkpoint should be restored.
        checkpointer: Optional explicit checkpointer instance.

    Returns:
        ``(session, step)`` -- the restored state and its step number.
        Returns ``(None, 0)`` when no checkpoint exists.
    """
    if checkpointer is None:
        checkpointer = _get_checkpointer()

    return await checkpointer.load_latest(session_id)
