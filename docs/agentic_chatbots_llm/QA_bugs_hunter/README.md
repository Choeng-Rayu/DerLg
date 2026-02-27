# DerLg AI Agent — QA Test Plan
## Professional QA: Agentic Chatbot Bug Prediction & Test Suite

**Scope:** Python AI Agent only (LangGraph + Claude API + Tool Calls + WebSocket)  
**NOT in scope:** Frontend UI, NestJS backend, Supabase database  
**Test focus:** Conversation behavior, state transitions, tool calling, memory, language, edge cases  

---

## Bug Risk Assessment (Before Testing)

After analyzing the agent architecture, here are the **highest-risk areas** ranked by likelihood × impact:

| Rank | Bug Area | Risk | Why It Will Likely Happen |
|---|---|---|---|
| 🔴 1 | Tool called before all discovery fields collected | CRITICAL | LLM may short-circuit discovery when user gives partial info |
| 🔴 2 | Booking created without explicit user confirmation | CRITICAL | LLM may misread "sounds good" as "yes book it" |
| 🔴 3 | Hallucinated price / trip data not from tool result | CRITICAL | LLM falls back to training data when tool fails |
| 🔴 4 | Payment QR re-generated without user requesting it | HIGH | Loop logic may call generateQR on every message |
| 🔴 5 | State stuck after tool error (no recovery path) | HIGH | Exception in tool executor leaves session in broken state |
| 🟡 6 | Wrong language after mid-conversation switch | HIGH | System prompt language injection not re-applied every turn |
| 🟡 7 | Session not resumed correctly after disconnect | HIGH | Redis TTL or deserialization error silently creates new session |
| 🟡 8 | Parallel tool calls with conflicting session side effects | MEDIUM | asyncio.gather writes to session simultaneously |
| 🟡 9 | AI asks two questions in one message | MEDIUM | Prompt instruction violated during complex state transitions |
| 🟡 10 | Cancellation processed without refund amount shown first | MEDIUM | AI interprets "yes cancel" before confirming amount |

---

## Test Suite Index

| File | Category | Test Count |
|---|---|---|
| `QA-01-discovery-stage.md` | Discovery Stage Bugs | 18 tests |
| `QA-02-tool-calling.md` | Tool Calling Bugs | 22 tests |
| `QA-03-state-machine.md` | State Machine & Transitions | 20 tests |
| `QA-04-payment-flow.md` | Payment & QR Bugs | 16 tests |
| `QA-05-session-memory.md` | Session & Memory Bugs | 14 tests |
| `QA-06-language.md` | Multi-Language Bugs | 12 tests |
| `QA-07-edge-cases.md` | Adversarial & Edge Case Bugs | 20 tests |
| `QA-08-tool-failures.md` | Tool Failure & Recovery | 15 tests |

**Total: 137 test cases**

---

## How to Read Each Test Case

```
TEST ID:        Unique ID (e.g., DISC-001)
CATEGORY:       Which bug area
RISK LEVEL:     🔴 Critical / 🟡 High / 🟢 Medium
PRECONDITION:   Session state before test starts
USER SAYS:      Exact message(s) sent to the agent
EXPECTED:       What the agent MUST do
BUG PREDICTION: What will likely go wrong
FIX DIRECTION:  Where to look in code to fix it
```