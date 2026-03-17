"""Unit tests for the input sanitization utilities.

Covers sanitize_user_input (control character stripping, null-byte removal,
truncation, non-string handling) and validate_tool_input (recursive
sanitization of dict values while preserving non-string types).
"""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest

from utils.sanitizer import sanitize_user_input, validate_tool_input


# ---------------------------------------------------------------------------
# sanitize_user_input
# ---------------------------------------------------------------------------


class TestSanitizeUserInputControlChars:
    """Control-character stripping."""

    def test_strips_common_control_characters(self):
        # \x01 (SOH), \x02 (STX), \x7f (DEL) should all be removed
        text = "hello\x01world\x02!\x7f"
        assert sanitize_user_input(text) == "helloworld!"

    def test_preserves_newlines(self):
        text = "line1\nline2\n"
        assert sanitize_user_input(text) == "line1\nline2"

    def test_preserves_tabs(self):
        text = "col1\tcol2"
        assert sanitize_user_input(text) == "col1\tcol2"

    def test_preserves_carriage_return_newline(self):
        # \r (\x0d) is not in the removed range [\x0e-\x1f]
        # and is also not in [\x01-\x08], [\x0b-\x0c] -- \r is \x0d
        text = "line1\r\nline2"
        result = sanitize_user_input(text)
        assert "line1" in result
        assert "line2" in result

    def test_strips_bell_character(self):
        text = "alert\x07me"
        assert sanitize_user_input(text) == "alertme"

    def test_strips_escape_character(self):
        text = "esc\x1bhere"
        assert sanitize_user_input(text) == "eschere"


class TestSanitizeUserInputNullBytes:
    """Null-byte removal."""

    def test_removes_null_bytes(self):
        text = "hello\x00world"
        assert sanitize_user_input(text) == "helloworld"

    def test_removes_multiple_null_bytes(self):
        text = "\x00\x00hello\x00\x00"
        assert sanitize_user_input(text) == "hello"

    def test_null_byte_only_string(self):
        text = "\x00\x00\x00"
        assert sanitize_user_input(text) == ""


class TestSanitizeUserInputTruncation:
    """Max-length truncation."""

    def test_truncates_long_strings_default(self):
        text = "a" * 5000
        result = sanitize_user_input(text)
        assert len(result) == 4096

    def test_does_not_truncate_short_strings(self):
        text = "short"
        assert sanitize_user_input(text) == "short"

    def test_truncates_to_custom_max_length(self):
        text = "a" * 200
        result = sanitize_user_input(text, max_length=50)
        assert len(result) == 50

    def test_exact_length_string_not_truncated(self):
        text = "a" * 4096
        result = sanitize_user_input(text)
        assert len(result) == 4096


class TestSanitizeUserInputNonStrings:
    """Non-string input handling."""

    def test_returns_empty_for_none(self):
        assert sanitize_user_input(None) == ""

    def test_returns_empty_for_int(self):
        assert sanitize_user_input(42) == ""

    def test_returns_empty_for_list(self):
        assert sanitize_user_input(["a", "b"]) == ""

    def test_returns_empty_for_dict(self):
        assert sanitize_user_input({"key": "value"}) == ""

    def test_returns_empty_for_bool(self):
        assert sanitize_user_input(True) == ""


class TestSanitizeUserInputStripping:
    """Whitespace stripping (via .strip())."""

    def test_strips_leading_and_trailing_whitespace(self):
        text = "   hello world   "
        assert sanitize_user_input(text) == "hello world"

    def test_strips_mixed_whitespace(self):
        text = "\t\n  hello  \n\t"
        assert sanitize_user_input(text) == "hello"

    def test_empty_string_returns_empty(self):
        assert sanitize_user_input("") == ""

    def test_whitespace_only_returns_empty(self):
        assert sanitize_user_input("   ") == ""


# ---------------------------------------------------------------------------
# validate_tool_input
# ---------------------------------------------------------------------------


class TestValidateToolInputStrings:
    """String value sanitization in tool inputs."""

    def test_sanitizes_string_values(self):
        tool_input = {"name": "John\x00Doe\x01", "city": "Phnom Penh"}
        result = validate_tool_input("test_tool", tool_input)
        assert result["name"] == "JohnDoe"
        assert result["city"] == "Phnom Penh"

    def test_truncates_long_string_values_to_1024(self):
        tool_input = {"query": "x" * 2000}
        result = validate_tool_input("test_tool", tool_input)
        assert len(result["query"]) == 1024

    def test_sanitizes_nested_string_values(self):
        tool_input = {
            "outer": {
                "inner": "clean\x00value\x07"
            }
        }
        result = validate_tool_input("test_tool", tool_input)
        assert result["outer"]["inner"] == "cleanvalue"


class TestValidateToolInputNonStrings:
    """Preservation of non-string types."""

    def test_preserves_integer_values(self):
        tool_input = {"count": 42, "offset": 0}
        result = validate_tool_input("test_tool", tool_input)
        assert result["count"] == 42
        assert result["offset"] == 0

    def test_preserves_float_values(self):
        tool_input = {"price": 99.99, "discount": 0.15}
        result = validate_tool_input("test_tool", tool_input)
        assert result["price"] == 99.99
        assert result["discount"] == 0.15

    def test_preserves_bool_values(self):
        tool_input = {"active": True, "deleted": False}
        result = validate_tool_input("test_tool", tool_input)
        assert result["active"] is True
        assert result["deleted"] is False

    def test_preserves_mixed_types(self):
        tool_input = {
            "name": "trip\x00test",
            "count": 5,
            "price": 10.5,
            "confirmed": True,
        }
        result = validate_tool_input("test_tool", tool_input)
        assert result["name"] == "triptest"
        assert result["count"] == 5
        assert result["price"] == 10.5
        assert result["confirmed"] is True


class TestValidateToolInputLists:
    """List value handling."""

    def test_sanitizes_strings_in_list(self):
        tool_input = {"tags": ["safe", "bad\x00tag\x01", "ok"]}
        result = validate_tool_input("test_tool", tool_input)
        assert result["tags"] == ["safe", "badtag", "ok"]

    def test_preserves_non_strings_in_list(self):
        tool_input = {"ids": [1, 2, 3]}
        result = validate_tool_input("test_tool", tool_input)
        assert result["ids"] == [1, 2, 3]

    def test_mixed_types_in_list(self):
        tool_input = {"mixed": ["text\x00", 42, True]}
        result = validate_tool_input("test_tool", tool_input)
        assert result["mixed"] == ["text", 42, True]


class TestValidateToolInputEdgeCases:
    """Edge cases for validate_tool_input."""

    def test_empty_dict_returns_empty_dict(self):
        result = validate_tool_input("test_tool", {})
        assert result == {}

    def test_non_dict_input_returns_empty_dict(self):
        result = validate_tool_input("test_tool", "not a dict")
        assert result == {}

    def test_non_dict_none_returns_empty_dict(self):
        result = validate_tool_input("test_tool", None)
        assert result == {}

    def test_deeply_nested_dicts(self):
        tool_input = {
            "level1": {
                "level2": {
                    "level3": "deep\x00value"
                }
            }
        }
        result = validate_tool_input("test_tool", tool_input)
        assert result["level1"]["level2"]["level3"] == "deepvalue"

    def test_preserves_unknown_types_as_is(self):
        """Types not explicitly handled (e.g. tuple) are passed through."""
        tool_input = {"data": (1, 2, 3)}
        result = validate_tool_input("test_tool", tool_input)
        assert result["data"] == (1, 2, 3)
