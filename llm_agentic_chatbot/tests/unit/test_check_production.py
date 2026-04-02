"""Unit tests for the production readiness checklist (scripts/check_production.py).

Tests cover:
- Environment variable validation checks
- Model backend configuration checks
- Service key security checks
- Redis URL format checks
- Backend URL format checks
- Log level checks
- Artifact existence checks
- Report generation and exit code logic
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from unittest.mock import patch

# Add the project root to path so we can import from scripts/
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from scripts.check_production import CheckRunner, CheckStatus


def _make_runner(**kwargs) -> CheckRunner:
    """Create a CheckRunner with network checks skipped by default."""
    defaults = {"skip_network": True}
    defaults.update(kwargs)
    return CheckRunner(**defaults)


# ---------------------------------------------------------------------------
# Environment variable checks
# ---------------------------------------------------------------------------


class TestRequiredEnvVars:
    """Tests for check_required_env_vars."""

    def test_all_required_vars_set(self) -> None:
        env = {
            "MODEL_BACKEND": "anthropic",
            "BACKEND_URL": "https://api.derlg.com",
            "AI_SERVICE_KEY": "a" * 32,
            "REDIS_URL": "redis://localhost:6379",
        }
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_required_env_vars()

        for r in runner.results:
            assert r.status == CheckStatus.PASS, f"{r.name}: {r.message}"

    def test_missing_required_var_fails(self) -> None:
        env = {
            "MODEL_BACKEND": "anthropic",
            "BACKEND_URL": "https://api.derlg.com",
            "AI_SERVICE_KEY": "a" * 32,
            # REDIS_URL intentionally missing
        }
        with patch.dict(os.environ, env, clear=False):
            # Remove REDIS_URL if it exists
            os.environ.pop("REDIS_URL", None)
            runner = _make_runner()
            runner.check_required_env_vars()

        redis_results = [r for r in runner.results if "REDIS_URL" in r.name]
        assert any(r.status == CheckStatus.FAIL for r in redis_results)


# ---------------------------------------------------------------------------
# Model backend checks
# ---------------------------------------------------------------------------


class TestModelBackendConfig:
    """Tests for check_model_backend_config."""

    def test_anthropic_with_key_passes(self) -> None:
        env = {
            "MODEL_BACKEND": "anthropic",
            "ANTHROPIC_API_KEY": "sk-ant-real-key-123456",
        }
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_model_backend_config()

        assert all(
            r.status in (CheckStatus.PASS,) for r in runner.results
        ), [r.message for r in runner.results]

    def test_anthropic_without_key_fails(self) -> None:
        env = {"MODEL_BACKEND": "anthropic"}
        with patch.dict(os.environ, env, clear=False):
            os.environ.pop("ANTHROPIC_API_KEY", None)
            runner = _make_runner()
            runner.check_model_backend_config()

        api_key_results = [r for r in runner.results if "ANTHROPIC_API_KEY" in r.name]
        assert any(r.status == CheckStatus.FAIL for r in api_key_results)

    def test_anthropic_test_key_warns(self) -> None:
        env = {
            "MODEL_BACKEND": "anthropic",
            "ANTHROPIC_API_KEY": "sk-ant-test-fake-key",
        }
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_model_backend_config()

        api_key_results = [r for r in runner.results if "ANTHROPIC_API_KEY" in r.name]
        assert any(r.status == CheckStatus.WARN for r in api_key_results)

    def test_invalid_backend_fails(self) -> None:
        env = {"MODEL_BACKEND": "gpt4"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_model_backend_config()

        backend_results = [r for r in runner.results if "MODEL_BACKEND" in r.name]
        assert any(r.status == CheckStatus.FAIL for r in backend_results)

    def test_ollama_with_url_passes(self) -> None:
        env = {
            "MODEL_BACKEND": "ollama",
            "OLLAMA_BASE_URL": "http://localhost:11434",
        }
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_model_backend_config()

        assert all(r.status == CheckStatus.PASS for r in runner.results)

    def test_ollama_without_url_fails(self) -> None:
        env = {"MODEL_BACKEND": "ollama"}
        with patch.dict(os.environ, env, clear=False):
            os.environ.pop("OLLAMA_BASE_URL", None)
            runner = _make_runner()
            runner.check_model_backend_config()

        url_results = [r for r in runner.results if "OLLAMA_BASE_URL" in r.name]
        assert any(r.status == CheckStatus.FAIL for r in url_results)


# ---------------------------------------------------------------------------
# Service key security checks
# ---------------------------------------------------------------------------


class TestServiceKeySecurity:
    """Tests for check_service_key_strength."""

    def test_strong_key_passes(self) -> None:
        env = {"AI_SERVICE_KEY": "a" * 64}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_service_key_strength()

        assert all(r.status == CheckStatus.PASS for r in runner.results)

    def test_short_key_fails(self) -> None:
        env = {"AI_SERVICE_KEY": "short"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_service_key_strength()

        length_results = [r for r in runner.results if "LENGTH" in r.name]
        assert any(r.status == CheckStatus.FAIL for r in length_results)

    def test_placeholder_key_fails(self) -> None:
        env = {"AI_SERVICE_KEY": "change-this-to-a-real-key-please-it-is-long-enough-now"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_service_key_strength()

        placeholder_results = [r for r in runner.results if "PLACEHOLDER" in r.name]
        assert any(r.status == CheckStatus.FAIL for r in placeholder_results)


# ---------------------------------------------------------------------------
# Redis URL format checks
# ---------------------------------------------------------------------------


class TestRedisUrlFormat:
    """Tests for check_redis_url_format."""

    def test_redis_url_passes(self) -> None:
        env = {"REDIS_URL": "redis://localhost:6379"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_redis_url_format()

        assert any(r.status in (CheckStatus.PASS, CheckStatus.WARN) for r in runner.results)

    def test_rediss_url_passes(self) -> None:
        env = {"REDIS_URL": "rediss://user:pass@host:6380"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_redis_url_format()

        assert any(r.status == CheckStatus.PASS for r in runner.results)

    def test_invalid_url_scheme_fails(self) -> None:
        env = {"REDIS_URL": "http://localhost:6379"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_redis_url_format()

        assert any(r.status == CheckStatus.FAIL for r in runner.results)

    def test_unencrypted_redis_warns(self) -> None:
        env = {"REDIS_URL": "redis://localhost:6379"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_redis_url_format()

        assert any(r.status == CheckStatus.WARN for r in runner.results)


# ---------------------------------------------------------------------------
# Backend URL format checks
# ---------------------------------------------------------------------------


class TestBackendUrlFormat:
    """Tests for check_backend_url_format."""

    def test_valid_url_passes(self) -> None:
        env = {"BACKEND_URL": "https://api.derlg.com"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_backend_url_format()

        format_results = [r for r in runner.results if "FORMAT" in r.name]
        assert all(r.status == CheckStatus.PASS for r in format_results)

    def test_trailing_slash_warns(self) -> None:
        env = {"BACKEND_URL": "https://api.derlg.com/"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_backend_url_format()

        format_results = [r for r in runner.results if "FORMAT" in r.name]
        assert any(r.status == CheckStatus.WARN for r in format_results)

    def test_localhost_warns(self) -> None:
        env = {"BACKEND_URL": "http://localhost:3001"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_backend_url_format()

        prod_results = [r for r in runner.results if "PRODUCTION" in r.name]
        assert any(r.status == CheckStatus.WARN for r in prod_results)


# ---------------------------------------------------------------------------
# Log level checks
# ---------------------------------------------------------------------------


class TestLogLevel:
    """Tests for check_log_level."""

    def test_info_level_passes(self) -> None:
        env = {"LOG_LEVEL": "info"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_log_level()

        assert runner.results[0].status == CheckStatus.PASS

    def test_debug_level_warns(self) -> None:
        env = {"LOG_LEVEL": "debug"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_log_level()

        assert runner.results[0].status == CheckStatus.WARN

    def test_invalid_level_fails(self) -> None:
        env = {"LOG_LEVEL": "verbose"}
        with patch.dict(os.environ, env, clear=False):
            runner = _make_runner()
            runner.check_log_level()

        assert runner.results[0].status == CheckStatus.FAIL


# ---------------------------------------------------------------------------
# Artifact checks
# ---------------------------------------------------------------------------


class TestArtifactChecks:
    """Tests for Dockerfile / requirements.txt existence checks."""

    def test_dockerfile_exists(self) -> None:
        runner = _make_runner()
        runner.check_dockerfile_exists()
        assert runner.results[0].status == CheckStatus.PASS

    def test_requirements_exists(self) -> None:
        runner = _make_runner()
        runner.check_requirements_exists()
        assert runner.results[0].status == CheckStatus.PASS


# ---------------------------------------------------------------------------
# Report / exit code
# ---------------------------------------------------------------------------


class TestReportAndExitCode:
    """Tests for has_failures and report generation."""

    def test_has_failures_when_fail_present(self) -> None:
        runner = _make_runner()
        runner.record("test", CheckStatus.FAIL, "something broke")
        assert runner.has_failures is True

    def test_no_failures_when_only_pass(self) -> None:
        runner = _make_runner()
        runner.record("test", CheckStatus.PASS, "all good")
        assert runner.has_failures is False

    def test_no_failures_when_only_warn(self) -> None:
        runner = _make_runner()
        runner.record("test", CheckStatus.WARN, "minor issue")
        assert runner.has_failures is False

    def test_print_report_runs_without_error(self, capsys) -> None:
        runner = _make_runner()
        runner.record("test:pass", CheckStatus.PASS, "ok")
        runner.record("test:fail", CheckStatus.FAIL, "broken")
        runner.record("test:warn", CheckStatus.WARN, "hmm")
        runner.record("test:skip", CheckStatus.SKIP, "skipped")
        runner.print_report()

        captured = capsys.readouterr()
        assert "Production Readiness Checklist" in captured.out
        assert "[PASS]" in captured.out
        assert "[FAIL]" in captured.out
        assert "[WARN]" in captured.out
        assert "[SKIP]" in captured.out
