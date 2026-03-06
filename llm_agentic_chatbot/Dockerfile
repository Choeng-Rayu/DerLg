# =============================================================================
# DerLg.com AI Agent - Production Dockerfile
# =============================================================================
# Multi-stage build for minimal production image
# Python 3.11-slim base for compatibility with Python 3.11+ features

# ---------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies in a virtual environment
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies needed for compiled Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# Create a virtual environment for clean dependency isolation
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies (cached layer unless requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 2: Runtime - Minimal production image
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

# Metadata labels
LABEL maintainer="DerLg.com Team"
LABEL description="DerLg.com AI Agent - Cambodia Travel Booking Chatbot"
LABEL version="1.0.0"

# Create a non-root user for security
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy application source code
COPY main.py .
COPY config/ ./config/
COPY agent/ ./agent/
COPY api/ ./api/
COPY utils/ ./utils/

# Change ownership to the non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8000

# Health check: verify the /health endpoint responds within 5 seconds
# Retries 3 times with 30-second intervals, starting 10 seconds after launch
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start the application with uvicorn using 2 workers for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-config", "/dev/null"]
