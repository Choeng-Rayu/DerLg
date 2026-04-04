# DerLg.com — Agent Development Guide

This document provides essential information for AI coding agents working in this repository.

## Project Overview

DerLg is a full-stack travel booking platform for Cambodia with three main services:
- **Backend**: NestJS 11 (TypeScript) - REST API server
- **Frontend**: Next.js 16 (TypeScript) - Mobile-first PWA
- **LLM Agentic Chatbot**: FastAPI (Python 3.11+) - AI conversation agent

---

## Build, Lint, and Test Commands

### Backend (NestJS)

```bash
cd backend

# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger

# Build
npm run build              # Production build

# Linting & Formatting
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting

# Testing
npm run test               # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run with coverage report
npm run test:e2e           # Run E2E tests
npm run test:debug         # Debug tests

# Run single test file
npm run test -- app.controller.spec.ts
npm run test:e2e -- app.e2e-spec.ts
```

### Frontend (Next.js)

```bash
cd frontend

# Development
npm run dev                # Start dev server (port 3000)

# Build
npm run build              # Production build
npm run start              # Serve production build

# Linting
npm run lint               # ESLint check

# Note: No test framework currently configured
```

### LLM Agentic Chatbot (Python/FastAPI)

```bash
cd llm_agentic_chatbot

# Development
python main.py             # Start FastAPI server
# or
uvicorn main:app --reload --port 8000

# Testing
pytest                     # Run all tests
pytest tests/unit/         # Run unit tests only
pytest tests/integration/  # Run integration tests only
pytest tests/property/     # Run property-based tests
pytest -v                  # Verbose output
pytest -k test_name        # Run specific test
pytest --cov               # Run with coverage

# Code Quality
black .                    # Format code
pylint **/*.py             # Lint code
mypy .                     # Type checking

# Run single test
pytest tests/unit/test_settings.py
pytest tests/unit/test_settings.py::test_function_name
```

---

## Code Style Guidelines

### Backend (TypeScript/NestJS)

#### Imports
```typescript
// Order: external → @nestjs → internal
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
```

#### Formatting (Prettier + ESLint)
- **Single quotes** for strings: `'hello'` not `"hello"`
- **Trailing commas** everywhere (ES5+)
- **No semicolons** (automatic)
- **2 spaces** indentation
- Files must end with a newline

#### Types & Naming
```typescript
// Use PascalCase for classes, interfaces, types, enums
export class TripService {}
export interface BookingDto {}
export type PaymentStatus = 'pending' | 'completed';

// Use camelCase for variables, functions, methods
const userId = 123;
async function createBooking() {}

// Use SCREAMING_SNAKE_CASE for constants
const MAX_BOOKING_DAYS = 30;

// Disable `any` is allowed (eslint rule off) but avoid when possible
// Prefer explicit types or use `unknown` for truly unknown data
```

#### Error Handling
```typescript
// Use NestJS built-in exceptions
throw new NotFoundException('Trip not found');
throw new BadRequestException('Invalid booking date');
throw new UnauthorizedException('Service key required');

// For custom errors, extend HttpException
export class InsufficientFundsException extends HttpException {
  constructor() {
    super('Insufficient funds', HttpStatus.PAYMENT_REQUIRED);
  }
}
```

#### Async/Await
- Always use `async/await` over raw promises
- ESLint warns on floating promises (unawaited async calls)

---

### Frontend (TypeScript/Next.js)

#### Imports
```typescript
// Order: react → next → external → components → lib → types
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
```

#### Component Structure
```typescript
// Prefer named exports for consistency
export function HomePage() {
  return <div>Content</div>;
}

// Use default export only for pages (Next.js requirement)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html>{children}</html>;
}
```

#### Types
```typescript
// Define prop types inline for simple components
export function UserCard({ name, age }: { name: string; age: number }) {}

// Extract to interface for complex types
interface BookingCardProps {
  booking: Booking;
  onCancel: () => void;
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {}
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `BookingCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`)
- **Stores**: camelCase with `Store` suffix (e.g., `authStore.ts`)

#### State Management
- **Server state**: React Query (planned)
- **Client state**: Zustand stores
- **Form state**: React Hook Form (planned)

---

### Python (FastAPI)

#### Imports
```python
# Order: stdlib → third-party → local
import os
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
from config.settings import settings
```

#### Formatting (Black + Pylint)
- **Line length**: 88 characters (Black default)
- **4 spaces** indentation
- **Double quotes** for strings: `"hello"` not `'hello'`
- Files must end with a newline

#### Type Hints
```python
# Always use type hints for function signatures
def create_booking(user_id: int, trip_id: str) -> Booking:
    pass

# Use Optional for nullable values
def get_user(user_id: int) -> Optional[User]:
    pass

# Use type aliases for complex types
UserId = int
BookingStatus = Literal["pending", "confirmed", "cancelled"]
```

#### Naming Conventions
```python
# snake_case for functions, variables, modules
def calculate_total_price():
    trip_duration = 5

# PascalCase for classes
class TripBookingService:
    pass

# SCREAMING_SNAKE_CASE for constants
MAX_BOOKING_DAYS = 30
API_VERSION = "1.0.0"

# Private attributes with single underscore
class Session:
    def __init__(self):
        self._redis_key = "session:123"
```

#### Docstrings
```python
"""
Module docstring using triple double-quotes.

Follows Google style docstrings.
"""

def complex_function(param1: str, param2: int) -> dict:
    """
    Brief one-line description.
    
    More detailed description if needed. Explain behavior,
    not implementation.
    
    Args:
        param1: Description of param1
        param2: Description of param2
        
    Returns:
        Dictionary containing result data
        
    Raises:
        ValueError: When param2 is negative
    """
    pass
```

#### Error Handling
```python
# Use FastAPI HTTPException for API errors
from fastapi import HTTPException

raise HTTPException(status_code=404, detail="Trip not found")
raise HTTPException(status_code=400, detail="Invalid booking date")

# Use custom exceptions for business logic
class InsufficientFundsError(Exception):
    pass

# Validate early with Pydantic
class BookingRequest(BaseModel):
    trip_id: str
    user_id: int
    start_date: str  # Will be validated by Pydantic
```

#### Async Code
```python
# Prefer async/await for I/O operations
async def fetch_user(user_id: int) -> User:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"/users/{user_id}")
        return User(**response.json())

# Use await for Redis, database, HTTP calls
await redis.set(key, value)
await db.execute(query)
```

---

## Testing Patterns

### Backend (Jest)
```typescript
// Unit test example
describe('TripService', () => {
  it('should create a trip', async () => {
    const trip = await service.create(tripDto);
    expect(trip.id).toBeDefined();
  });
});

// E2E test example
describe('AppController (e2e)', () => {
  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });
});
```

### Python (Pytest)
```python
# Unit test example
def test_validate_booking_date():
    assert is_valid_date("2026-04-15") is True
    assert is_valid_date("2020-01-01") is False

# Async test example
@pytest.mark.asyncio
async def test_fetch_user():
    user = await fetch_user(123)
    assert user.id == 123
```

---

## Key Architectural Patterns

1. **Service Layer**: Business logic lives in services, not controllers/routes
2. **DTO Pattern**: Use Data Transfer Objects for API inputs/outputs
3. **Dependency Injection**: NestJS uses DI; Python uses FastAPI's Depends()
4. **Environment Validation**: All services validate config on startup (fail fast)
5. **Error Boundaries**: Frontend uses React error boundaries; backend uses exception filters
6. **Separation of Concerns**: AI agent never directly modifies data; always goes through backend

---

## Important Notes

- **No test framework** is configured for the frontend yet
- Backend uses **Jest 30** (latest), not older versions
- Python code uses **Pydantic v2** syntax (not v1)
- All services support **hot-reload** during development
- Use **structured logging** (structlog) in Python, not print statements
- Frontend uses **Next.js App Router** (not Pages Router)
- Backend uses **NestJS module system** for organization
