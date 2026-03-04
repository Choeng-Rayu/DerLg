# Implementation Tasks: DerLg.com AI Agent (Agentic LLM Chatbot)

## Overview

This task list implements the Python FastAPI AI Agent service with LangGraph state machine orchestration, Claude Sonnet 4.5 integration, WebSocket communication, and comprehensive tool calling capabilities for Cambodia travel booking assistance.

## Phase 1: Project Foundation and Configuration

### Task 1.1: Project Structure and Dependencies

- [ ] 1.1.1 Create project directory structure (agent/, api/, config/, utils/, tests/)
- [ ] 1.1.2 Create requirements.txt with all dependencies (FastAPI, LangGraph, Anthropic, Redis, etc.)
- [ ] 1.1.3 Create .env.example with all required environment variables
- [ ] 1.1.4 Create main.py with FastAPI application initialization
- [ ] 1.1.5 Create config/settings.py with Pydantic BaseSettings
- [ ] 1.1.6 Implement environment variable validation on startup
- [ ] 1.1.7 Create Dockerfile for production deployment
- [ ] 1.1.8 Create Dockerfile.dev for development with hot reload
- [ ] 1.1.9 Create docker-compose.yml entry for AI agent service
- [ ] 1.1.10 Create README.md with setup and deployment instructions

### Task 1.2: Logging and Monitoring Setup

- [ ] 1.2.1 Configure structlog for structured JSON logging
- [ ] 1.2.2 Implement logging middleware for all requests
- [ ] 1.2.3 Create utils/logging.py with log level configuration
- [ ] 1.2.4 Integrate Sentry for error tracking
- [ ] 1.2.5 Create /health endpoint for health checks
- [ ] 1.2.6 Create /metrics endpoint with Prometheus format
- [ ] 1.2.7 Implement metrics tracking (active connections, messages processed, tool calls)


## Phase 2: Data Models and State Management

### Task 2.1: Conversation State Models

- [ ] 2.1.1 Create agent/session/state.py with AgentState enum (7 stages)
- [ ] 2.1.2 Implement ConversationState Pydantic model with all fields
- [ ] 2.1.3 Add JSON serialization/deserialization methods
- [ ] 2.1.4 Implement datetime handling for created_at, last_active, reserved_until
- [ ] 2.1.5 Add validation for preferred_language (EN, KH, ZH)
- [ ] 2.1.6 Create property-based tests for state serialization round-trip

### Task 2.2: Redis Integration

- [ ] 2.2.1 Create utils/redis.py with Redis connection utilities
- [ ] 2.2.2 Implement init_redis and close_redis lifecycle functions
- [ ] 2.2.3 Create agent/session/manager.py with SessionManager class
- [ ] 2.2.4 Implement save_session method with 7-day TTL
- [ ] 2.2.5 Implement load_session method with deserialization
- [ ] 2.2.6 Implement delete_session method
- [ ] 2.2.7 Add booking hold expiration check on session load
- [ ] 2.2.8 Implement state recovery for expired booking holds
- [ ] 2.2.9 Add Redis connection error handling with retry logic
- [ ] 2.2.10 Create unit tests for session persistence


## Phase 3: Model Client Architecture

### Task 3.1: Model Client Interface

- [ ] 3.1.1 Create agent/models/client.py with ModelClient abstract interface
- [ ] 3.1.2 Define create_message method signature
- [ ] 3.1.3 Create ModelResponse dataclass
- [ ] 3.1.4 Create ContentBlock dataclass for response content
- [ ] 3.1.5 Implement get_model_client factory function

### Task 3.2: Anthropic Client Implementation

- [ ] 3.2.1 Create agent/models/anthropic.py with AnthropicClient class
- [ ] 3.2.2 Initialize AsyncAnthropic client with API key
- [ ] 3.2.3 Implement create_message method calling Claude Sonnet 4.5
- [ ] 3.2.4 Convert Anthropic response format to ModelResponse
- [ ] 3.2.5 Handle tool_use and end_turn stop reasons
- [ ] 3.2.6 Implement error handling and retry logic
- [ ] 3.2.7 Add timeout configuration (60 seconds)
- [ ] 3.2.8 Log token usage and latency metrics

### Task 3.3: Ollama Client Implementation

- [ ] 3.3.1 Create agent/models/ollama.py with OllamaClient class
- [ ] 3.3.2 Implement HTTP client for Ollama API
- [ ] 3.3.3 Convert Claude tool schemas to OpenAI format
- [ ] 3.3.4 Implement create_message method for Ollama
- [ ] 3.3.5 Convert Ollama response format to ModelResponse
- [ ] 3.3.6 Add fallback to Anthropic for Khmer language
- [ ] 3.3.7 Create unit tests for both clients


## Phase 4: Tool System Implementation

### Task 4.1: Tool Schema Definitions

- [ ] 4.1.1 Create agent/tools/schemas.py
- [ ] 4.1.2 Define getTripSuggestions tool schema with all parameters
- [ ] 4.1.3 Define getTripItinerary tool schema
- [ ] 4.1.4 Define getTripImages tool schema
- [ ] 4.1.5 Define getHotelDetails tool schema
- [ ] 4.1.6 Define getWeatherForecast tool schema
- [ ] 4.1.7 Define compareTrips tool schema
- [ ] 4.1.8 Define calculateCustomTrip tool schema
- [ ] 4.1.9 Define customizeTrip tool schema
- [ ] 4.1.10 Define applyDiscountCode tool schema
- [ ] 4.1.11 Define validateUserDetails tool schema
- [ ] 4.1.12 Define createBooking tool schema with all parameters
- [ ] 4.1.13 Define generatePaymentQR tool schema
- [ ] 4.1.14 Define checkPaymentStatus tool schema
- [ ] 4.1.15 Define cancelBooking tool schema
- [ ] 4.1.16 Define modifyBooking tool schema
- [ ] 4.1.17 Define getPlaces tool schema
- [ ] 4.1.18 Define getUpcomingFestivals tool schema
- [ ] 4.1.19 Define estimateBudget tool schema
- [ ] 4.1.20 Define getCurrencyRates tool schema
- [ ] 4.1.21 Add detailed descriptions and examples for each tool
- [ ] 4.1.22 Create property-based tests for schema validation

### Task 4.2: Tool Handlers - Trip Tools

- [ ] 4.2.1 Create agent/tools/handlers/trips.py
- [ ] 4.2.2 Implement getTripSuggestions handler calling backend API
- [ ] 4.2.3 Implement getTripItinerary handler
- [ ] 4.2.4 Implement getTripImages handler
- [ ] 4.2.5 Implement compareTrips handler
- [ ] 4.2.6 Implement calculateCustomTrip handler
- [ ] 4.2.7 Implement customizeTrip handler
- [ ] 4.2.8 Add error handling for all trip tool handlers
- [ ] 4.2.9 Create unit tests with mocked backend responses


### Task 4.3: Tool Handlers - Booking Tools

- [ ] 4.3.1 Create agent/tools/handlers/booking.py
- [ ] 4.3.2 Implement validateUserDetails handler
- [ ] 4.3.3 Implement createBooking handler with all parameters
- [ ] 4.3.4 Implement cancelBooking handler
- [ ] 4.3.5 Implement modifyBooking handler
- [ ] 4.3.6 Implement applyDiscountCode handler
- [ ] 4.3.7 Add validation for booking parameters
- [ ] 4.3.8 Create unit tests for booking tool handlers

### Task 4.4: Tool Handlers - Payment Tools

- [ ] 4.4.1 Create agent/tools/handlers/payment.py
- [ ] 4.4.2 Implement generatePaymentQR handler
- [ ] 4.4.3 Implement checkPaymentStatus handler
- [ ] 4.4.4 Add error handling for payment failures
- [ ] 4.4.5 Create unit tests for payment tool handlers

### Task 4.5: Tool Handlers - Information Tools

- [ ] 4.5.1 Create agent/tools/handlers/info.py
- [ ] 4.5.2 Implement getHotelDetails handler
- [ ] 4.5.3 Implement getWeatherForecast handler
- [ ] 4.5.4 Implement getPlaces handler with filtering
- [ ] 4.5.5 Implement getUpcomingFestivals handler
- [ ] 4.5.6 Implement estimateBudget handler
- [ ] 4.5.7 Implement getCurrencyRates handler
- [ ] 4.5.8 Create unit tests for information tool handlers

### Task 4.6: Tool Execution System

- [ ] 4.6.1 Create agent/tools/executor.py
- [ ] 4.6.2 Implement execute_tools_parallel function with asyncio.gather
- [ ] 4.6.3 Create TOOL_DISPATCH dictionary mapping tool names to handlers
- [ ] 4.6.4 Implement httpx.AsyncClient for backend HTTP requests
- [ ] 4.6.5 Add X-Service-Key header to all backend requests
- [ ] 4.6.6 Add Accept-Language header based on session language
- [ ] 4.6.7 Implement 15-second timeout for tool requests
- [ ] 4.6.8 Convert tool results to Anthropic tool_result format
- [ ] 4.6.9 Implement error handling and generic error responses
- [ ] 4.6.10 Create integration tests with mocked backend


### Task 4.7: Session Side Effects

- [ ] 4.7.1 Create _apply_session_side_effects function
- [ ] 4.7.2 Update suggested_trip_ids when getTripSuggestions succeeds
- [ ] 4.7.3 Update booking_id, booking_ref, reserved_until when createBooking succeeds
- [ ] 4.7.4 Transition state to PAYMENT when createBooking succeeds
- [ ] 4.7.5 Update payment_intent_id when generatePaymentQR succeeds
- [ ] 4.7.6 Update payment_status and transition to POST_BOOKING when payment succeeds
- [ ] 4.7.7 Clear booking context and reset to DISCOVERY when cancelBooking succeeds
- [ ] 4.7.8 Create unit tests for all side effect scenarios

## Phase 5: System Prompt Engineering

### Task 5.1: Prompt Builder Implementation

- [ ] 5.1.1 Create agent/prompts/builder.py
- [ ] 5.1.2 Implement build_system_prompt function
- [ ] 5.1.3 Create base prompt with core identity and absolute rules
- [ ] 5.1.4 Add context section with session state variables
- [ ] 5.1.5 Create agent/prompts/templates.py for stage-specific prompts

### Task 5.2: Stage-Specific Prompts

- [ ] 5.2.1 Create DISCOVERY stage prompt (gather 6 required fields)
- [ ] 5.2.2 Create SUGGESTION stage prompt (present trip options)
- [ ] 5.2.3 Create EXPLORATION stage prompt (answer questions, provide details)
- [ ] 5.2.4 Create CUSTOMIZATION stage prompt (discuss modifications)
- [ ] 5.2.5 Create BOOKING stage prompt (3-step booking flow)
- [ ] 5.2.6 Create PAYMENT stage prompt (generate QR, monitor status)
- [ ] 5.2.7 Create POST_BOOKING stage prompt (confirmation and next steps)

### Task 5.3: Language-Specific Instructions

- [ ] 5.3.1 Add English (EN) language instructions
- [ ] 5.3.2 Add Khmer (KH) language instructions
- [ ] 5.3.3 Add Chinese (ZH) language instructions
- [ ] 5.3.4 Create unit tests for prompt generation with all states and languages


## Phase 6: Response Formatting System

### Task 6.1: Message Type Definitions

- [ ] 6.1.1 Create agent/formatters/message_types.py
- [ ] 6.1.2 Define TextMessage Pydantic model
- [ ] 6.1.3 Define TripCardsMessage model with trip data
- [ ] 6.1.4 Define QRPaymentMessage model with QR data
- [ ] 6.1.5 Define BookingConfirmedMessage model
- [ ] 6.1.6 Define WeatherMessage model with forecast data
- [ ] 6.1.7 Define ItineraryMessage model
- [ ] 6.1.8 Define BudgetEstimateMessage model
- [ ] 6.1.9 Define ComparisonMessage model for trip comparisons
- [ ] 6.1.10 Define ImageGalleryMessage model
- [ ] 6.1.11 Add "type" field to all message models for frontend routing

### Task 6.2: Response Formatter Implementation

- [ ] 6.2.1 Create agent/formatters/formatter.py
- [ ] 6.2.2 Implement format_response function
- [ ] 6.2.3 Detect "trips" array in tool results → return TripCardsMessage
- [ ] 6.2.4 Detect "qr_code_url" → return QRPaymentMessage
- [ ] 6.2.5 Detect payment success + POST_BOOKING state → return BookingConfirmedMessage
- [ ] 6.2.6 Detect "forecast" → return WeatherMessage
- [ ] 6.2.7 Detect "itinerary" → return ItineraryMessage
- [ ] 6.2.8 Detect "total_estimate_usd" → return BudgetEstimateMessage
- [ ] 6.2.9 Detect exactly 2 trips → return ComparisonMessage
- [ ] 6.2.10 Detect "images" array → return ImageGalleryMessage
- [ ] 6.2.11 Default to TextMessage when no structured data present
- [ ] 6.2.12 Create unit tests for all message type detections


## Phase 7: LangGraph State Machine

### Task 7.1: State Machine Definition

- [ ] 7.1.1 Create agent/graph.py
- [ ] 7.1.2 Define LangGraph StateGraph
- [ ] 7.1.3 Create call_llm node function
- [ ] 7.1.4 Create execute_tools node function
- [ ] 7.1.5 Create format_response node function
- [ ] 7.1.6 Set call_llm as entry point
- [ ] 7.1.7 Add edge: call_llm → execute_tools (when stop_reason = "tool_use")
- [ ] 7.1.8 Add edge: call_llm → format_response (when stop_reason = "end_turn")
- [ ] 7.1.9 Add edge: execute_tools → call_llm (loop back)
- [ ] 7.1.10 Add edge: format_response → END

### Task 7.2: State Persistence with RedisSaver

- [ ] 7.2.1 Configure RedisSaver as LangGraph checkpointer
- [ ] 7.2.2 Persist state after each node execution
- [ ] 7.2.3 Implement checkpoint loading for conversation resumption
- [ ] 7.2.4 Create integration tests for state persistence

### Task 7.3: Agent Execution Loop

- [ ] 7.3.1 Create agent/core.py
- [ ] 7.3.2 Implement run_agent function
- [ ] 7.3.3 Append user message to session.messages
- [ ] 7.3.4 Build system prompt using build_system_prompt
- [ ] 7.3.5 Get model client using get_model_client
- [ ] 7.3.6 Pass last 20 messages to model (context window limit)
- [ ] 7.3.7 Pass all 20 tool schemas to model
- [ ] 7.3.8 Set max_tokens to 2048
- [ ] 7.3.9 Handle tool_use stop_reason with tool execution loop
- [ ] 7.3.10 Handle end_turn stop_reason with response formatting
- [ ] 7.3.11 Implement maximum 5 tool call loops to prevent infinite loops
- [ ] 7.3.12 Return formatted response to WebSocket handler
- [ ] 7.3.13 Create integration tests for agent execution


## Phase 8: WebSocket Server Implementation

### Task 8.1: WebSocket Endpoint

- [ ] 8.1.1 Create api/websocket.py
- [ ] 8.1.2 Define WebSocket endpoint at /ws/{session_id}
- [ ] 8.1.3 Accept WebSocket connection
- [ ] 8.1.4 Load or create session on connection
- [ ] 8.1.5 Maintain active_connections dictionary

### Task 8.2: Authentication and Welcome Flow

- [ ] 8.2.1 Expect first message to be auth message with user_id and language
- [ ] 8.2.2 Update session.user_id and session.preferred_language
- [ ] 8.2.3 Send welcome message for new sessions
- [ ] 8.2.4 Send resume message for existing sessions
- [ ] 8.2.5 Create welcome/resume message templates in all languages

### Task 8.3: Message Handling

- [ ] 8.3.1 Listen for messages with type "user_message"
- [ ] 8.3.2 Send typing_start indicator when processing begins
- [ ] 8.3.3 Call run_agent function with session and message
- [ ] 8.3.4 Send typing_end indicator when processing completes
- [ ] 8.3.5 Send formatted response message
- [ ] 8.3.6 Send error message with type "error" on failures
- [ ] 8.3.7 Save session to Redis after every message exchange

### Task 8.4: Connection Management

- [ ] 8.4.1 Save session on WebSocket disconnect
- [ ] 8.4.2 Remove connection from active_connections
- [ ] 8.4.3 Implement graceful shutdown handling
- [ ] 8.4.4 Add connection timeout handling
- [ ] 8.4.5 Create integration tests for WebSocket flow


## Phase 9: Payment Event Listener

### Task 9.1: Redis Pub/Sub Integration

- [ ] 9.1.1 Start background task listen_for_payment_events on WebSocket connect
- [ ] 9.1.2 Subscribe to Redis channel "payment_events:{user_id}"
- [ ] 9.1.3 Listen for payment events with status "SUCCEEDED"

### Task 9.2: Payment Confirmation Flow

- [ ] 9.2.1 Update session state to POST_BOOKING on payment success
- [ ] 9.2.2 Update session.payment_status to "CONFIRMED"
- [ ] 9.2.3 Save session to Redis
- [ ] 9.2.4 Send payment_confirmed event to WebSocket
- [ ] 9.2.5 Generate confirmation message using run_agent
- [ ] 9.2.6 Send confirmation message to WebSocket

### Task 9.3: Error Handling

- [ ] 9.3.1 Cancel payment listener task on WebSocket disconnect
- [ ] 9.3.2 Handle Redis connection errors gracefully
- [ ] 9.3.3 Implement reconnection logic for Redis pub/sub
- [ ] 9.3.4 Create integration tests for payment event flow

## Phase 10: Multi-Language Support

### Task 10.1: Language Configuration

- [ ] 10.1.1 Support three languages: EN, KH, ZH
- [ ] 10.1.2 Accept preferred_language in WebSocket auth message
- [ ] 10.1.3 Pass preferred_language to backend in Accept-Language header
- [ ] 10.1.4 Include language-specific instructions in system prompt

### Task 10.2: Language-Specific Behavior

- [ ] 10.2.1 Instruct Claude to respond in English for EN
- [ ] 10.2.2 Instruct Claude to respond in Khmer for KH
- [ ] 10.2.3 Instruct Claude to respond in Simplified Chinese for ZH
- [ ] 10.2.4 Always use AnthropicClient for KH (best Khmer support)
- [ ] 10.2.5 Pass language parameter to tools supporting localized content
- [ ] 10.2.6 Format welcome and resume messages in preferred language
- [ ] 10.2.7 Create integration tests for all three languages


## Phase 11: Error Handling and Resilience

### Task 11.1: Exception Handling

- [ ] 11.1.1 Catch all exceptions in WebSocket message handler
- [ ] 11.1.2 Log errors with full stack trace using structlog
- [ ] 11.1.3 Send user-friendly error messages to WebSocket
- [ ] 11.1.4 Sanitize error messages to avoid exposing internal details

### Task 11.2: Timeout Handling

- [ ] 11.2.1 Implement 60-second timeout for model API calls
- [ ] 11.2.2 Implement 15-second timeout for backend tool calls
- [ ] 11.2.3 Return error response on timeout and continue conversation
- [ ] 11.2.4 Create unit tests for timeout scenarios

### Task 11.3: Retry Logic

- [ ] 11.3.1 Retry model API calls once before returning error
- [ ] 11.3.2 Implement exponential backoff for retries
- [ ] 11.3.3 Create unit tests for retry logic

### Task 11.4: Circuit Breaker Pattern

- [ ] 11.4.1 Implement circuit breaker for backend API calls
- [ ] 11.4.2 Open circuit after 5 consecutive failures
- [ ] 11.4.3 Half-open circuit after 30-second cooldown
- [ ] 11.4.4 Inform user when backend is unavailable
- [ ] 11.4.5 Create integration tests for circuit breaker

### Task 11.5: Redis Connection Resilience

- [ ] 11.5.1 Log Redis connection failures
- [ ] 11.5.2 Attempt Redis reconnection with exponential backoff
- [ ] 11.5.3 Gracefully degrade when Redis is unavailable
- [ ] 11.5.4 Create integration tests for Redis failure scenarios


## Phase 12: Security and Authentication

### Task 12.1: Service Key Authentication

- [ ] 12.1.1 Require AI_SERVICE_KEY environment variable
- [ ] 12.1.2 Include X-Service-Key header in all backend requests
- [ ] 12.1.3 Validate AI_SERVICE_KEY is at least 32 characters on startup
- [ ] 12.1.4 Fail fast with clear error if key is missing or invalid

### Task 12.2: Input Validation

- [ ] 12.2.1 Validate session_id format (UUID) before accepting connection
- [ ] 12.2.2 Require user_id in auth message before processing
- [ ] 12.2.3 Sanitize user input to prevent injection attacks
- [ ] 12.2.4 Validate all tool inputs before making backend calls

### Task 12.3: Rate Limiting

- [ ] 12.3.1 Implement rate limiting on WebSocket messages (10 per minute per session)
- [ ] 12.3.2 Use Redis for distributed rate limiting
- [ ] 12.3.3 Return rate limit error message to user
- [ ] 12.3.4 Create unit tests for rate limiting

### Task 12.4: Secure Communication

- [ ] 12.4.1 Use TLS for Redis connections (rediss:// scheme)
- [ ] 12.4.2 Do not expose internal errors to WebSocket clients
- [ ] 12.4.3 Do not log sensitive data (user_id, booking_id, payment_intent_id) in plain text
- [ ] 12.4.4 Implement security headers in FastAPI responses


## Phase 13: Testing Infrastructure

### Task 13.1: Unit Tests

- [ ] 13.1.1 Create tests/unit/ directory structure
- [ ] 13.1.2 Write unit tests for all tool handlers (20 tools)
- [ ] 13.1.3 Write unit tests for system prompt builder (all states)
- [ ] 13.1.4 Write unit tests for response formatter (all message types)
- [ ] 13.1.5 Write unit tests for session side effects logic
- [ ] 13.1.6 Mock external dependencies (Anthropic, backend, Redis)
- [ ] 13.1.7 Use pytest-asyncio for async test support
- [ ] 13.1.8 Achieve minimum 80% code coverage

### Task 13.2: Integration Tests

- [ ] 13.2.1 Create tests/integration/ directory structure
- [ ] 13.2.2 Write integration tests for WebSocket message flow
- [ ] 13.2.3 Write integration tests for tool execution with mocked backend
- [ ] 13.2.4 Write integration tests for payment event listener
- [ ] 13.2.5 Write integration tests for state machine execution
- [ ] 13.2.6 Use test Redis instance for integration tests

### Task 13.3: Property-Based Tests

- [ ] 13.3.1 Create tests/property/ directory structure
- [ ] 13.3.2 Write property tests for ConversationState serialization round-trip
- [ ] 13.3.3 Write property tests for tool schema validation
- [ ] 13.3.4 Use Hypothesis library for property-based testing
- [ ] 13.3.5 Verify parse(format(x)) == x for all data models

### Task 13.4: Test Configuration

- [ ] 13.4.1 Create pytest.ini configuration
- [ ] 13.4.2 Create conftest.py with shared fixtures
- [ ] 13.4.3 Configure test coverage reporting
- [ ] 13.4.4 Create test environment variables file
- [ ] 13.4.5 Add test commands to README.md


## Phase 14: Docker Development Environment

### Task 14.1: Development Dockerfile

- [ ] 14.1.1 Create Dockerfile.dev with Python 3.11 base image
- [ ] 14.1.2 Install dependencies from requirements.txt
- [ ] 14.1.3 Configure uvicorn with --reload for hot reload
- [ ] 14.1.4 Expose port 8000
- [ ] 14.1.5 Set working directory to /app

### Task 14.2: Docker Compose Integration

- [ ] 14.2.1 Add ai-agent service to docker-compose.yml
- [ ] 14.2.2 Configure environment variables (MODEL_BACKEND, ANTHROPIC_API_KEY, etc.)
- [ ] 14.2.3 Set up volume mounts for hot reload (./ai-agent:/app)
- [ ] 14.2.4 Configure dependencies (wait for Redis and Backend)
- [ ] 14.2.5 Add to derlg-network bridge network
- [ ] 14.2.6 Map port 8000:8000

### Task 14.3: Service Communication

- [ ] 14.3.1 Configure BACKEND_URL to use container name (http://backend:3001)
- [ ] 14.3.2 Configure REDIS_URL to use container name (redis://redis:6379)
- [ ] 14.3.3 Test inter-service communication
- [ ] 14.3.4 Verify WebSocket connections from frontend container

### Task 14.4: Development Workflow

- [ ] 14.4.1 Document docker-compose up command
- [ ] 14.4.2 Document hot reload behavior
- [ ] 14.4.3 Document debugging with docker-compose exec
- [ ] 14.4.4 Document viewing logs with docker-compose logs
- [ ] 14.4.5 Create troubleshooting guide for common issues


## Phase 15: Production Deployment

### Task 15.1: Production Dockerfile

- [ ] 15.1.1 Create Dockerfile with multi-stage build
- [ ] 15.1.2 Use Python 3.11-slim base image for smaller size
- [ ] 15.1.3 Install production dependencies only
- [ ] 15.1.4 Copy application code
- [ ] 15.1.5 Expose port 8000
- [ ] 15.1.6 Add HEALTHCHECK instruction
- [ ] 15.1.7 Run with uvicorn using 2 workers
- [ ] 15.1.8 Create .dockerignore to exclude unnecessary files

### Task 15.2: Railway Deployment Configuration

- [ ] 15.2.1 Create railway.json configuration file
- [ ] 15.2.2 Configure build command
- [ ] 15.2.3 Configure start command
- [ ] 15.2.4 Set health check path to /health
- [ ] 15.2.5 Configure environment variables in Railway dashboard
- [ ] 15.2.6 Document deployment steps in README.md

### Task 15.3: Environment Configuration

- [ ] 15.3.1 Create .env.example with all required variables
- [ ] 15.3.2 Document MODEL_BACKEND options (anthropic, ollama)
- [ ] 15.3.3 Document ANTHROPIC_API_KEY requirement
- [ ] 15.3.4 Document BACKEND_URL format
- [ ] 15.3.5 Document AI_SERVICE_KEY generation
- [ ] 15.3.6 Document REDIS_URL format (Upstash)
- [ ] 15.3.7 Document optional SENTRY_DSN for error tracking

### Task 15.4: Production Monitoring

- [ ] 15.4.1 Configure Sentry error tracking
- [ ] 15.4.2 Set up Prometheus metrics collection
- [ ] 15.4.3 Configure structured logging for production
- [ ] 15.4.4 Set up health check monitoring
- [ ] 15.4.5 Configure uptime monitoring
- [ ] 15.4.6 Document monitoring dashboard access


## Phase 16: Integration with Backend and Frontend

### Task 16.1: Backend AI Tools API Integration

- [ ] 16.1.1 Verify backend /v1/ai-tools/ endpoints are implemented
- [ ] 16.1.2 Test getTripSuggestions tool with backend
- [ ] 16.1.3 Test createBooking tool with backend
- [ ] 16.1.4 Test generatePaymentQR tool with backend
- [ ] 16.1.5 Test all 20 tools end-to-end with backend
- [ ] 16.1.6 Verify X-Service-Key authentication works
- [ ] 16.1.7 Verify Accept-Language header is respected
- [ ] 16.1.8 Test error handling for backend failures

### Task 16.2: Frontend WebSocket Integration

- [ ] 16.2.1 Verify frontend can connect to /ws/{session_id}
- [ ] 16.2.2 Test auth message flow from frontend
- [ ] 16.2.3 Test user message sending from frontend
- [ ] 16.2.4 Test structured message rendering in frontend
- [ ] 16.2.5 Test typing indicators in frontend
- [ ] 16.2.6 Test connection status indicators in frontend
- [ ] 16.2.7 Test reconnection logic from frontend
- [ ] 16.2.8 Test chat history persistence in frontend

### Task 16.3: Payment Event Integration

- [ ] 16.3.1 Verify backend publishes to Redis payment_events channel
- [ ] 16.3.2 Test payment event listener receives events
- [ ] 16.3.3 Test payment confirmation flow end-to-end
- [ ] 16.3.4 Verify frontend receives payment confirmation
- [ ] 16.3.5 Test state transition to POST_BOOKING

### Task 16.4: Multi-Service Testing

- [ ] 16.4.1 Test complete booking flow (Frontend → AI Agent → Backend)
- [ ] 16.4.2 Test payment flow with Stripe webhook
- [ ] 16.4.3 Test emergency alert flow
- [ ] 16.4.4 Test student discount verification flow
- [ ] 16.4.5 Test loyalty points redemption flow
- [ ] 16.4.6 Create end-to-end test suite for critical flows


## Phase 17: Documentation and Developer Experience

### Task 17.1: API Documentation

- [ ] 17.1.1 Document WebSocket connection protocol
- [ ] 17.1.2 Document message format specifications
- [ ] 17.1.3 Document all tool schemas with examples
- [ ] 17.1.4 Document conversation state model
- [ ] 17.1.5 Document error codes and handling
- [ ] 17.1.6 Create API reference documentation

### Task 17.2: Developer Guide

- [ ] 17.2.1 Write setup instructions for local development
- [ ] 17.2.2 Document Docker development workflow
- [ ] 17.2.3 Document testing procedures
- [ ] 17.2.4 Document debugging techniques
- [ ] 17.2.5 Create troubleshooting guide
- [ ] 17.2.6 Document common issues and solutions

### Task 17.3: Architecture Documentation

- [ ] 17.3.1 Create architecture diagrams (state machine, data flow)
- [ ] 17.3.2 Document design decisions and rationale
- [ ] 17.3.3 Document LangGraph state machine flow
- [ ] 17.3.4 Document tool execution pipeline
- [ ] 17.3.5 Document session management strategy
- [ ] 17.3.6 Document multi-language support approach

### Task 17.4: Code Quality

- [ ] 17.4.1 Add type hints to all Python functions
- [ ] 17.4.2 Add docstrings to all public functions and classes
- [ ] 17.4.3 Configure Black for code formatting
- [ ] 17.4.4 Configure Pylint for linting
- [ ] 17.4.5 Configure mypy for type checking
- [ ] 17.4.6 Add pre-commit hooks for formatting and linting
- [ ] 17.4.7 Create CONTRIBUTING.md with code standards


## Phase 18: Performance Optimization

### Task 18.1: Response Time Optimization

- [ ] 18.1.1 Profile tool execution times
- [ ] 18.1.2 Optimize parallel tool execution
- [ ] 18.1.3 Implement caching for frequently accessed data
- [ ] 18.1.4 Optimize Redis operations
- [ ] 18.1.5 Reduce model API latency with streaming (if supported)
- [ ] 18.1.6 Benchmark end-to-end response times

### Task 18.2: Resource Optimization

- [ ] 18.2.1 Optimize memory usage for session storage
- [ ] 18.2.2 Implement connection pooling for HTTP clients
- [ ] 18.2.3 Optimize Redis connection management
- [ ] 18.2.4 Profile CPU usage and optimize hot paths
- [ ] 18.2.5 Configure appropriate worker count for production

### Task 18.3: Scalability

- [ ] 18.3.1 Test horizontal scaling with multiple instances
- [ ] 18.3.2 Verify Redis state sharing across instances
- [ ] 18.3.3 Test load balancing behavior
- [ ] 18.3.4 Implement graceful shutdown for zero-downtime deploys
- [ ] 18.3.5 Document scaling recommendations

## Phase 19: Advanced Features

### Task 19.1: Conversation Context Management

- [ ] 19.1.1 Implement conversation summarization for long sessions
- [ ] 19.1.2 Optimize message history pruning (keep last 20 messages)
- [ ] 19.1.3 Implement context window management
- [ ] 19.1.4 Add conversation export functionality
- [ ] 19.1.5 Test context preservation across reconnections

### Task 19.2: Enhanced Error Recovery

- [ ] 19.2.1 Implement automatic retry for transient failures
- [ ] 19.2.2 Add fallback responses for tool failures
- [ ] 19.2.3 Implement graceful degradation when services unavailable
- [ ] 19.2.4 Add user-friendly error explanations
- [ ] 19.2.5 Test error recovery scenarios

### Task 19.3: Analytics and Insights

- [ ] 19.3.1 Track conversation metrics (duration, message count)
- [ ] 19.3.2 Track tool usage statistics
- [ ] 19.3.3 Track state transition patterns
- [ ] 19.3.4 Track conversion rates (discovery → booking)
- [ ] 19.3.5 Create analytics dashboard
- [ ] 19.3.6 Export metrics to monitoring system


## Phase 20: Quality Assurance and Launch Preparation

### Task 20.1: Comprehensive Testing

- [ ] 20.1.1 Run full test suite (unit, integration, property-based)
- [ ] 20.1.2 Verify 80%+ code coverage achieved
- [ ] 20.1.3 Perform load testing with multiple concurrent connections
- [ ] 20.1.4 Test all 7 conversation states thoroughly
- [ ] 20.1.5 Test all 20 tools with various inputs
- [ ] 20.1.6 Test error scenarios and edge cases
- [ ] 20.1.7 Test multi-language support (EN, KH, ZH)
- [ ] 20.1.8 Perform security testing (injection, authentication)

### Task 20.2: User Acceptance Testing

- [ ] 20.2.1 Test complete booking flow with real users
- [ ] 20.2.2 Test payment flow with test Stripe account
- [ ] 20.2.3 Test emergency alert flow
- [ ] 20.2.4 Gather feedback on conversation quality
- [ ] 20.2.5 Test on multiple devices and browsers
- [ ] 20.2.6 Verify mobile responsiveness
- [ ] 20.2.7 Test offline behavior

### Task 20.3: Production Readiness Checklist

- [ ] 20.3.1 Verify all environment variables configured
- [ ] 20.3.2 Verify Anthropic API key is valid and has credits
- [ ] 20.3.3 Verify backend AI_SERVICE_KEY matches
- [ ] 20.3.4 Verify Redis connection (Upstash) is configured
- [ ] 20.3.5 Verify Sentry error tracking is working
- [ ] 20.3.6 Verify health check endpoint responds correctly
- [ ] 20.3.7 Verify metrics endpoint is accessible
- [ ] 20.3.8 Verify logging is configured for production
- [ ] 20.3.9 Verify CORS settings allow frontend domain
- [ ] 20.3.10 Verify rate limiting is enabled

### Task 20.4: Launch Documentation

- [ ] 20.4.1 Create deployment runbook
- [ ] 20.4.2 Document rollback procedures
- [ ] 20.4.3 Create incident response guide
- [ ] 20.4.4 Document monitoring and alerting setup
- [ ] 20.4.5 Create user guide for AI chat features
- [ ] 20.4.6 Document known limitations and workarounds

### Task 20.5: Post-Launch Monitoring

- [ ] 20.5.1 Set up alerts for error rate thresholds
- [ ] 20.5.2 Set up alerts for response time degradation
- [ ] 20.5.3 Set up alerts for WebSocket connection failures
- [ ] 20.5.4 Monitor Anthropic API usage and costs
- [ ] 20.5.5 Monitor Redis memory usage
- [ ] 20.5.6 Create dashboard for real-time metrics
- [ ] 20.5.7 Schedule regular performance reviews


## Phase 21: Future Enhancements (Optional)

### Task 21.1: Ollama Local Model Support

- [ ] 21.1.1* Test OllamaClient with local models
- [ ] 21.1.2* Benchmark performance vs Anthropic
- [ ] 21.1.3* Test quality of responses with local models
- [ ] 21.1.4* Document model selection criteria
- [ ] 21.1.5* Create migration guide for switching models

### Task 21.2: Advanced Conversation Features

- [ ] 21.2.1* Implement conversation branching
- [ ] 21.2.2* Add support for voice input/output
- [ ] 21.2.3* Implement image understanding for trip photos
- [ ] 21.2.4* Add support for file attachments
- [ ] 21.2.5* Implement conversation templates

### Task 21.3: Enhanced Personalization

- [ ] 21.3.1* Implement user preference learning
- [ ] 21.3.2* Add personalized trip recommendations
- [ ] 21.3.3* Implement conversation style adaptation
- [ ] 21.3.4* Add support for saved conversation contexts
- [ ] 21.3.5* Implement proactive suggestions

### Task 21.4: Multi-Agent Collaboration

- [ ] 21.4.1* Design multi-agent architecture
- [ ] 21.4.2* Implement specialist agents (booking, travel info, emergency)
- [ ] 21.4.3* Implement agent coordination logic
- [ ] 21.4.4* Test multi-agent conversations
- [ ] 21.4.5* Document multi-agent patterns

## Summary

This comprehensive task list covers the complete implementation of the DerLg.com AI Agent service, from project foundation through production deployment and future enhancements. The tasks are organized into 21 phases with clear dependencies and alignment with the backend NestJS API and frontend Next.js application.

### Key Milestones

1. **Phase 1-3**: Foundation (project setup, data models, model clients)
2. **Phase 4-7**: Core Functionality (tools, prompts, state machine, agent loop)
3. **Phase 8-10**: Communication (WebSocket, payment events, multi-language)
4. **Phase 11-12**: Reliability (error handling, security)
5. **Phase 13-14**: Development (testing, Docker environment)
6. **Phase 15-16**: Deployment (production setup, integration)
7. **Phase 17-19**: Polish (documentation, performance, advanced features)
8. **Phase 20**: Launch (QA, production readiness)
9. **Phase 21**: Future (optional enhancements)

### Dependencies

- **Backend**: Requires NestJS backend with /v1/ai-tools/ endpoints
- **Frontend**: Integrates with Next.js WebSocket client
- **External Services**: Anthropic API, Redis (Upstash), Stripe
- **Infrastructure**: Docker, Railway (or similar PaaS)

### Success Criteria

- All 20 tools implemented and tested
- 7-stage conversation flow working correctly
- WebSocket communication stable and reliable
- Multi-language support (EN, KH, ZH) functional
- 80%+ test coverage achieved
- Production deployment successful
- Integration with backend and frontend verified
