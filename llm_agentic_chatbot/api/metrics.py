"""Prometheus-format metrics endpoint for monitoring.

Tracks operational counters (messages, tools, errors, model calls) as well as
analytics metrics:
- Conversation duration (histogram buckets)
- Tool usage broken down by tool name
- State transitions between conversation stages
"""
from __future__ import annotations
import time
from collections import defaultdict
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter()

# Simple counters using module-level state
class Metrics:
    def __init__(self) -> None:
        # Operational counters
        self.messages_processed: int = 0
        self.tool_calls_total: int = 0
        self.active_connections: int = 0
        self.errors_total: int = 0
        self.model_calls_total: int = 0
        self._start_time: float = time.time()

        # Analytics: tool usage by name
        self._tool_usage_by_name: dict[str, int] = defaultdict(int)

        # Analytics: state transitions (from_state -> to_state -> count)
        self._state_transitions: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

        # Analytics: conversation durations in seconds (completed sessions)
        self._conversation_durations: list[float] = []

        # Analytics: active conversation start times (session_id -> start_time)
        self._conversation_starts: dict[str, float] = {}

    # -- Operational counters -------------------------------------------------

    def increment_messages(self) -> None:
        self.messages_processed += 1

    def increment_tool_calls(self, count: int = 1) -> None:
        self.tool_calls_total += count

    def increment_errors(self) -> None:
        self.errors_total += 1

    def increment_model_calls(self) -> None:
        self.model_calls_total += 1

    def set_active_connections(self, count: int) -> None:
        self.active_connections = count

    # -- Analytics: tool usage by name ----------------------------------------

    def record_tool_usage(self, tool_name: str) -> None:
        """Record a single invocation of *tool_name*."""
        self._tool_usage_by_name[tool_name] += 1

    def get_tool_usage(self) -> dict[str, int]:
        """Return a snapshot of per-tool invocation counts."""
        return dict(self._tool_usage_by_name)

    # -- Analytics: state transitions -----------------------------------------

    def record_state_transition(self, from_state: str, to_state: str) -> None:
        """Record a conversation state transition."""
        self._state_transitions[from_state][to_state] += 1

    def get_state_transitions(self) -> dict[str, dict[str, int]]:
        """Return a snapshot of state-transition counts."""
        return {
            src: dict(targets)
            for src, targets in self._state_transitions.items()
        }

    # -- Analytics: conversation duration -------------------------------------

    def start_conversation(self, session_id: str) -> None:
        """Mark the beginning of a conversation session."""
        self._conversation_starts[session_id] = time.time()

    def end_conversation(self, session_id: str) -> None:
        """Mark the end of a conversation session and record its duration."""
        start = self._conversation_starts.pop(session_id, None)
        if start is not None:
            duration = time.time() - start
            self._conversation_durations.append(duration)

    def get_conversation_duration_stats(self) -> dict[str, float]:
        """Return min/max/avg/count of completed conversation durations."""
        durations = self._conversation_durations
        if not durations:
            return {"count": 0, "min": 0.0, "max": 0.0, "avg": 0.0, "total": 0.0}
        return {
            "count": len(durations),
            "min": min(durations),
            "max": max(durations),
            "avg": sum(durations) / len(durations),
            "total": sum(durations),
        }


metrics = Metrics()

@router.get("/metrics", response_class=PlainTextResponse)
async def prometheus_metrics() -> str:
    uptime = time.time() - metrics._start_time
    lines = [
        "# HELP ai_agent_uptime_seconds Time since service started",
        "# TYPE ai_agent_uptime_seconds gauge",
        f"ai_agent_uptime_seconds {uptime:.2f}",
        "",
        "# HELP ai_agent_messages_processed_total Total user messages processed",
        "# TYPE ai_agent_messages_processed_total counter",
        f"ai_agent_messages_processed_total {metrics.messages_processed}",
        "",
        "# HELP ai_agent_tool_calls_total Total tool calls made",
        "# TYPE ai_agent_tool_calls_total counter",
        f"ai_agent_tool_calls_total {metrics.tool_calls_total}",
        "",
        "# HELP ai_agent_active_connections Current WebSocket connections",
        "# TYPE ai_agent_active_connections gauge",
        f"ai_agent_active_connections {metrics.active_connections}",
        "",
        "# HELP ai_agent_errors_total Total errors encountered",
        "# TYPE ai_agent_errors_total counter",
        f"ai_agent_errors_total {metrics.errors_total}",
        "",
        "# HELP ai_agent_model_calls_total Total LLM API calls",
        "# TYPE ai_agent_model_calls_total counter",
        f"ai_agent_model_calls_total {metrics.model_calls_total}",
        "",
        "# HELP ai_agent_tool_usage_by_name Tool invocations by tool name",
        "# TYPE ai_agent_tool_usage_by_name counter",
    ]

    for tool_name, count in sorted(metrics._tool_usage_by_name.items()):
        lines.append(f'ai_agent_tool_usage_by_name{{tool="{tool_name}"}} {count}')

    lines.append("")
    lines.append("# HELP ai_agent_state_transitions Conversation state transitions")
    lines.append("# TYPE ai_agent_state_transitions counter")

    for from_state, targets in sorted(metrics._state_transitions.items()):
        for to_state, count in sorted(targets.items()):
            lines.append(
                f'ai_agent_state_transitions{{from="{from_state}",to="{to_state}"}} {count}'
            )

    duration_stats = metrics.get_conversation_duration_stats()
    lines.append("")
    lines.append("# HELP ai_agent_conversation_duration_seconds Conversation duration statistics")
    lines.append("# TYPE ai_agent_conversation_duration_seconds summary")
    lines.append(f'ai_agent_conversation_duration_seconds_count {duration_stats["count"]}')
    lines.append(f'ai_agent_conversation_duration_seconds_total {duration_stats["total"]:.2f}')

    return "\n".join(lines) + "\n"
