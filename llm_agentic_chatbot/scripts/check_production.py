#!/usr/bin/env python3
"""Production readiness checklist for the DerLg AI Agent.

Validates that all required environment variables, external connections,
and runtime configuration are correctly set before deploying to production.

Exit codes:
    0 - All checks passed
    1 - One or more checks failed

Usage::

    # Run all checks
    python scripts/check_production.py

    # Run with verbose output
    python scripts/check_production.py --verbose

    # Run only environment checks (no network)
    python scripts/check_production.py --skip-network
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class CheckStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARN = "WARN"
    SKIP = "SKIP"


@dataclass
class CheckResult:
    name: str
    status: CheckStatus
    message: str


@dataclass
class CheckRunner:
    """Collects and runs production readiness checks."""

    results: list[CheckResult] = field(default_factory=list)
    verbose: bool = False
    skip_network: bool = False

    def record(self, name: str, status: CheckStatus, message: str) -> None:
        self.results.append(CheckResult(name=name, status=status, message=message))

    # ------------------------------------------------------------------
    # Environment variable checks
    # ------------------------------------------------------------------

    def check_required_env_vars(self) -> None:
        """Verify all required environment variables are set and non-empty."""
        required = [
            "MODEL_BACKEND",
            "BACKEND_URL",
            "AI_SERVICE_KEY",
            "REDIS_URL",
        ]
        for var in required:
            value = os.environ.get(var, "")
            if not value:
                self.record(
                    f"env:{var}",
                    CheckStatus.FAIL,
                    f"Required environment variable {var} is not set",
                )
            else:
                self.record(
                    f"env:{var}",
                    CheckStatus.PASS,
                    f"{var} is set",
                )

    def check_model_backend_config(self) -> None:
        """Verify MODEL_BACKEND is valid and corresponding keys are present."""
        backend = os.environ.get("MODEL_BACKEND", "")

        if backend not in ("anthropic", "ollama"):
            self.record(
                "config:MODEL_BACKEND",
                CheckStatus.FAIL,
                f"MODEL_BACKEND must be 'anthropic' or 'ollama', got '{backend}'",
            )
            return

        self.record(
            "config:MODEL_BACKEND",
            CheckStatus.PASS,
            f"MODEL_BACKEND={backend}",
        )

        if backend == "anthropic":
            key = os.environ.get("ANTHROPIC_API_KEY", "")
            if not key:
                self.record(
                    "config:ANTHROPIC_API_KEY",
                    CheckStatus.FAIL,
                    "ANTHROPIC_API_KEY is required when MODEL_BACKEND=anthropic",
                )
            elif key.startswith("sk-ant-test"):
                self.record(
                    "config:ANTHROPIC_API_KEY",
                    CheckStatus.WARN,
                    "ANTHROPIC_API_KEY appears to be a test key",
                )
            else:
                self.record(
                    "config:ANTHROPIC_API_KEY",
                    CheckStatus.PASS,
                    "ANTHROPIC_API_KEY is set",
                )

        if backend == "ollama":
            url = os.environ.get("OLLAMA_BASE_URL", "")
            if not url:
                self.record(
                    "config:OLLAMA_BASE_URL",
                    CheckStatus.FAIL,
                    "OLLAMA_BASE_URL is required when MODEL_BACKEND=ollama",
                )
            else:
                self.record(
                    "config:OLLAMA_BASE_URL",
                    CheckStatus.PASS,
                    f"OLLAMA_BASE_URL={url}",
                )

    def check_service_key_strength(self) -> None:
        """Verify AI_SERVICE_KEY meets minimum security requirements."""
        key = os.environ.get("AI_SERVICE_KEY", "")
        if len(key) < 32:
            self.record(
                "security:AI_SERVICE_KEY_LENGTH",
                CheckStatus.FAIL,
                f"AI_SERVICE_KEY must be >= 32 chars, got {len(key)}",
            )
        else:
            self.record(
                "security:AI_SERVICE_KEY_LENGTH",
                CheckStatus.PASS,
                f"AI_SERVICE_KEY length is {len(key)} chars",
            )

        placeholder_markers = ["change-this", "your-", "xxxxx", "placeholder", "example"]
        for marker in placeholder_markers:
            if marker in key.lower():
                self.record(
                    "security:AI_SERVICE_KEY_PLACEHOLDER",
                    CheckStatus.FAIL,
                    f"AI_SERVICE_KEY contains placeholder marker '{marker}'",
                )
                return
        if key:
            self.record(
                "security:AI_SERVICE_KEY_PLACEHOLDER",
                CheckStatus.PASS,
                "AI_SERVICE_KEY does not appear to be a placeholder",
            )

    def check_redis_url_format(self) -> None:
        """Verify REDIS_URL has a valid format."""
        url = os.environ.get("REDIS_URL", "")
        if not url:
            self.record(
                "config:REDIS_URL_FORMAT",
                CheckStatus.FAIL,
                "REDIS_URL is not set",
            )
            return

        if not (url.startswith("redis://") or url.startswith("rediss://")):
            self.record(
                "config:REDIS_URL_FORMAT",
                CheckStatus.FAIL,
                f"REDIS_URL must start with redis:// or rediss://, got '{url[:20]}...'",
            )
        else:
            # For production, prefer TLS (rediss://)
            if url.startswith("rediss://"):
                self.record(
                    "config:REDIS_URL_FORMAT",
                    CheckStatus.PASS,
                    "REDIS_URL uses TLS (rediss://)",
                )
            else:
                self.record(
                    "config:REDIS_URL_FORMAT",
                    CheckStatus.WARN,
                    "REDIS_URL uses unencrypted connection (redis://). Consider rediss:// for production.",
                )

    def check_backend_url_format(self) -> None:
        """Verify BACKEND_URL format."""
        url = os.environ.get("BACKEND_URL", "")
        if not url:
            return  # Already caught by required env check

        if url.endswith("/"):
            self.record(
                "config:BACKEND_URL_FORMAT",
                CheckStatus.WARN,
                "BACKEND_URL should not have a trailing slash",
            )
        else:
            self.record(
                "config:BACKEND_URL_FORMAT",
                CheckStatus.PASS,
                "BACKEND_URL format is valid",
            )

        if "localhost" in url or "127.0.0.1" in url:
            self.record(
                "config:BACKEND_URL_PRODUCTION",
                CheckStatus.WARN,
                "BACKEND_URL points to localhost -- not suitable for production",
            )
        else:
            self.record(
                "config:BACKEND_URL_PRODUCTION",
                CheckStatus.PASS,
                "BACKEND_URL does not point to localhost",
            )

    def check_log_level(self) -> None:
        """Verify LOG_LEVEL is appropriate for production."""
        level = os.environ.get("LOG_LEVEL", "info").lower()
        valid_levels = {"debug", "info", "warning", "error", "critical"}
        if level not in valid_levels:
            self.record(
                "config:LOG_LEVEL",
                CheckStatus.FAIL,
                f"LOG_LEVEL '{level}' is not valid. Must be one of {valid_levels}",
            )
        elif level == "debug":
            self.record(
                "config:LOG_LEVEL",
                CheckStatus.WARN,
                "LOG_LEVEL=debug is verbose for production. Consider 'info' or 'warning'.",
            )
        else:
            self.record(
                "config:LOG_LEVEL",
                CheckStatus.PASS,
                f"LOG_LEVEL={level}",
            )

    def check_sentry_dsn(self) -> None:
        """Check if error tracking is configured."""
        dsn = os.environ.get("SENTRY_DSN", "")
        if not dsn:
            self.record(
                "monitoring:SENTRY_DSN",
                CheckStatus.WARN,
                "SENTRY_DSN is not set -- error tracking is disabled",
            )
        else:
            self.record(
                "monitoring:SENTRY_DSN",
                CheckStatus.PASS,
                "SENTRY_DSN is configured for error tracking",
            )

    def check_port_config(self) -> None:
        """Verify PORT is valid."""
        port_str = os.environ.get("PORT", "8000")
        try:
            port = int(port_str)
            if 1 <= port <= 65535:
                self.record("config:PORT", CheckStatus.PASS, f"PORT={port}")
            else:
                self.record(
                    "config:PORT",
                    CheckStatus.FAIL,
                    f"PORT={port} is out of range (1-65535)",
                )
        except ValueError:
            self.record(
                "config:PORT",
                CheckStatus.FAIL,
                f"PORT='{port_str}' is not a valid integer",
            )

    # ------------------------------------------------------------------
    # Network checks
    # ------------------------------------------------------------------

    async def check_redis_connection(self) -> None:
        """Attempt to connect to Redis and ping."""
        redis_url = os.environ.get("REDIS_URL", "")
        if not redis_url:
            self.record(
                "network:REDIS_PING",
                CheckStatus.SKIP,
                "REDIS_URL not set, skipping",
            )
            return

        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(
                redis_url, encoding="utf-8", decode_responses=True,
                socket_connect_timeout=5,
            )
            await client.ping()
            await client.close()
            self.record(
                "network:REDIS_PING",
                CheckStatus.PASS,
                "Redis ping successful",
            )
        except ImportError:
            self.record(
                "network:REDIS_PING",
                CheckStatus.SKIP,
                "redis package not installed",
            )
        except Exception as exc:
            self.record(
                "network:REDIS_PING",
                CheckStatus.FAIL,
                f"Redis connection failed: {exc}",
            )

    async def check_health_endpoint(self) -> None:
        """Check if the /health endpoint is responding (if running locally)."""
        host = os.environ.get("HOST", "0.0.0.0")
        port = os.environ.get("PORT", "8000")
        url = f"http://127.0.0.1:{port}/health"

        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
            if resp.status_code == 200:
                self.record(
                    "network:HEALTH_ENDPOINT",
                    CheckStatus.PASS,
                    f"Health endpoint at {url} returned 200",
                )
            else:
                self.record(
                    "network:HEALTH_ENDPOINT",
                    CheckStatus.FAIL,
                    f"Health endpoint returned {resp.status_code}",
                )
        except ImportError:
            self.record(
                "network:HEALTH_ENDPOINT",
                CheckStatus.SKIP,
                "httpx package not installed",
            )
        except Exception:
            self.record(
                "network:HEALTH_ENDPOINT",
                CheckStatus.SKIP,
                f"Could not reach {url} (service may not be running)",
            )

    async def check_backend_reachable(self) -> None:
        """Check if the NestJS backend health endpoint is reachable."""
        backend_url = os.environ.get("BACKEND_URL", "")
        if not backend_url:
            self.record(
                "network:BACKEND_HEALTH",
                CheckStatus.SKIP,
                "BACKEND_URL not set, skipping",
            )
            return

        url = f"{backend_url.rstrip('/')}/v1/health"
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
            if resp.status_code == 200:
                self.record(
                    "network:BACKEND_HEALTH",
                    CheckStatus.PASS,
                    f"Backend health at {url} returned 200",
                )
            else:
                self.record(
                    "network:BACKEND_HEALTH",
                    CheckStatus.WARN,
                    f"Backend health at {url} returned {resp.status_code}",
                )
        except ImportError:
            self.record(
                "network:BACKEND_HEALTH",
                CheckStatus.SKIP,
                "httpx package not installed",
            )
        except Exception as exc:
            self.record(
                "network:BACKEND_HEALTH",
                CheckStatus.WARN,
                f"Backend at {url} not reachable: {exc}",
            )

    # ------------------------------------------------------------------
    # File / artifact checks
    # ------------------------------------------------------------------

    def check_dockerfile_exists(self) -> None:
        """Verify the production Dockerfile exists."""
        path = os.path.join(os.path.dirname(__file__), "..", "Dockerfile")
        if os.path.isfile(path):
            self.record("artifact:Dockerfile", CheckStatus.PASS, "Dockerfile exists")
        else:
            self.record(
                "artifact:Dockerfile",
                CheckStatus.FAIL,
                "Dockerfile not found in project root",
            )

    def check_requirements_exists(self) -> None:
        """Verify requirements.txt exists."""
        path = os.path.join(os.path.dirname(__file__), "..", "requirements.txt")
        if os.path.isfile(path):
            self.record(
                "artifact:requirements.txt",
                CheckStatus.PASS,
                "requirements.txt exists",
            )
        else:
            self.record(
                "artifact:requirements.txt",
                CheckStatus.FAIL,
                "requirements.txt not found",
            )

    # ------------------------------------------------------------------
    # Runner
    # ------------------------------------------------------------------

    async def run_all(self) -> None:
        """Execute all checks in order."""
        # Environment checks
        self.check_required_env_vars()
        self.check_model_backend_config()
        self.check_service_key_strength()
        self.check_redis_url_format()
        self.check_backend_url_format()
        self.check_log_level()
        self.check_sentry_dsn()
        self.check_port_config()

        # Artifact checks
        self.check_dockerfile_exists()
        self.check_requirements_exists()

        # Network checks (optional)
        if not self.skip_network:
            await self.check_redis_connection()
            await self.check_health_endpoint()
            await self.check_backend_reachable()

    def print_report(self) -> None:
        """Print the results in a human-readable format."""
        status_icons = {
            CheckStatus.PASS: "[PASS]",
            CheckStatus.FAIL: "[FAIL]",
            CheckStatus.WARN: "[WARN]",
            CheckStatus.SKIP: "[SKIP]",
        }

        print("\n" + "=" * 72)
        print("  DerLg AI Agent - Production Readiness Checklist")
        print("=" * 72 + "\n")

        for result in self.results:
            icon = status_icons[result.status]
            print(f"  {icon}  {result.name}")
            if self.verbose or result.status in (CheckStatus.FAIL, CheckStatus.WARN):
                print(f"         {result.message}")

        # Summary
        counts: dict[CheckStatus, int] = {s: 0 for s in CheckStatus}
        for result in self.results:
            counts[result.status] += 1

        print("\n" + "-" * 72)
        print(
            f"  Total: {len(self.results)}  |  "
            f"Pass: {counts[CheckStatus.PASS]}  |  "
            f"Fail: {counts[CheckStatus.FAIL]}  |  "
            f"Warn: {counts[CheckStatus.WARN]}  |  "
            f"Skip: {counts[CheckStatus.SKIP]}"
        )
        print("-" * 72)

        if counts[CheckStatus.FAIL] > 0:
            print("\n  RESULT: NOT READY FOR PRODUCTION")
            print("  Fix all FAIL items before deploying.\n")
        elif counts[CheckStatus.WARN] > 0:
            print("\n  RESULT: READY WITH WARNINGS")
            print("  Review WARN items before deploying.\n")
        else:
            print("\n  RESULT: READY FOR PRODUCTION\n")

    @property
    def has_failures(self) -> bool:
        return any(r.status == CheckStatus.FAIL for r in self.results)


def main() -> int:
    """CLI entry point. Returns 0 on success, 1 on failure."""
    parser = argparse.ArgumentParser(
        description="DerLg AI Agent production readiness checker"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show details for all checks, not just failures/warnings",
    )
    parser.add_argument(
        "--skip-network",
        action="store_true",
        help="Skip network connectivity checks (Redis, backend, health)",
    )
    args = parser.parse_args()

    runner = CheckRunner(verbose=args.verbose, skip_network=args.skip_network)
    asyncio.run(runner.run_all())
    runner.print_report()

    return 1 if runner.has_failures else 0


if __name__ == "__main__":
    sys.exit(main())
