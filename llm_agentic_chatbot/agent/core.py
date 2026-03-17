from __future__ import annotations
import json
from typing import Any
import structlog
from agent.session.state import ConversationState
from agent.session.side_effects import apply_session_side_effects
from agent.models import get_model_client
from agent.models.client import ModelResponse
from agent.tools.schemas import ALL_TOOLS
from agent.tools.executor import ToolExecutor
from agent.prompts.builder import build_system_prompt
from agent.formatters.formatter import format_response

logger = structlog.get_logger(__name__)

MAX_TOOL_LOOPS = 5
MAX_TOKENS = 2048
MESSAGE_WINDOW = 20


async def run_agent(session: ConversationState, user_text: str) -> dict[str, Any]:
    """Execute one conversation turn: user message -> AI response.

    Returns a formatted response dict ready to send to the frontend.
    """
    # 1. Append user message
    session.messages.append({
        "role": "user",
        "content": [{"type": "text", "text": user_text}],
    })

    # 2. Get model client and build prompt
    client = get_model_client(session.preferred_language)
    system_prompt = build_system_prompt(session)

    # 3. Run the agent loop (max MAX_TOOL_LOOPS iterations)
    tool_results_collected: list[dict[str, Any]] = []
    tool_executor = ToolExecutor()

    for loop_idx in range(MAX_TOOL_LOOPS):
        # Get last N messages for context window
        recent_messages = session.messages[-MESSAGE_WINDOW:]

        logger.info(
            "agent_loop_iteration",
            loop=loop_idx,
            message_count=len(recent_messages),
            state=session.state,
        )

        # Call the model
        response: ModelResponse = await client.create_message(
            system=system_prompt,
            messages=recent_messages,
            tools=ALL_TOOLS,
            max_tokens=MAX_TOKENS,
        )

        if response.stop_reason == "tool_use":
            # Extract tool_use blocks and text blocks
            assistant_content = []
            tool_calls = []

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

            # Append assistant message with tool_use blocks
            session.messages.append({
                "role": "assistant",
                "content": assistant_content,
            })

            # Execute tools in parallel
            results = await tool_executor.execute_tools_parallel(
                tool_calls, session.preferred_language
            )

            # Apply side effects and append results
            for result in results:
                tool_use_id = result["tool_use_id"]
                # Find the matching tool call name
                tool_name = next(
                    (tc["name"] for tc in tool_calls if tc["id"] == tool_use_id),
                    None,
                )
                if tool_name:
                    # Parse the content to get the actual data
                    try:
                        parsed = json.loads(result["content"]) if isinstance(result["content"], str) else result["content"]
                    except (json.JSONDecodeError, TypeError):
                        parsed = {}
                    apply_session_side_effects(session, tool_name, parsed)

                # Append tool_result to messages
                session.messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": result["tool_use_id"],
                            "content": result["content"],
                        }
                    ],
                })
                tool_results_collected.append(result)

            # Continue loop to let model process tool results
            continue

        elif response.stop_reason == "end_turn":
            # Extract text from response
            ai_text = ""
            for block in response.content:
                if block.type == "text" and block.text:
                    ai_text += block.text

            # Append assistant response
            session.messages.append({
                "role": "assistant",
                "content": [{"type": "text", "text": ai_text}],
            })

            # Format the response for the frontend
            formatted = format_response(ai_text, tool_results_collected, session)

            logger.info(
                "agent_turn_complete",
                state=session.state,
                tool_calls=len(tool_results_collected),
                response_type=formatted.get("type", "text"),
            )

            return formatted

        else:
            # Unknown stop reason, treat as end_turn
            ai_text = ""
            for block in response.content:
                if block.type == "text" and block.text:
                    ai_text += block.text

            session.messages.append({
                "role": "assistant",
                "content": [{"type": "text", "text": ai_text or "I apologize, something went wrong. Could you try again?"}],
            })

            return format_response(ai_text or "I apologize, something went wrong. Could you try again?", [], session)

    # Max loops reached
    logger.warning("agent_max_loops_reached", max_loops=MAX_TOOL_LOOPS)
    fallback_text = "I've been processing for a while. Let me summarize what I've found so far."
    session.messages.append({
        "role": "assistant",
        "content": [{"type": "text", "text": fallback_text}],
    })
    return format_response(fallback_text, tool_results_collected, session)
