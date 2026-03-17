"""Unit tests for tool schemas validation."""

import os
os.environ["SKIP_SETTINGS_INIT"] = "1"

import pytest
from agent.tools.schemas import ALL_TOOLS, TRAVEL_TOOLS
from agent.tools.handlers import TOOL_DISPATCH


class TestToolSchemas:

    def test_all_tools_count(self):
        """There should be 20 tool schemas defined."""
        assert len(ALL_TOOLS) == 20

    def test_travel_tools_alias(self):
        """TRAVEL_TOOLS should be the same list as ALL_TOOLS."""
        assert TRAVEL_TOOLS is ALL_TOOLS

    def test_each_tool_has_required_fields(self):
        for tool in ALL_TOOLS:
            assert "name" in tool, f"Tool missing 'name': {tool}"
            assert "description" in tool, f"Tool {tool.get('name')} missing 'description'"
            assert "input_schema" in tool, f"Tool {tool['name']} missing 'input_schema'"

    def test_each_tool_has_valid_schema(self):
        for tool in ALL_TOOLS:
            schema = tool["input_schema"]
            assert schema.get("type") == "object", f"Tool {tool['name']} input_schema type is not 'object'"
            assert "properties" in schema, f"Tool {tool['name']} missing properties"

    def test_each_tool_has_description(self):
        for tool in ALL_TOOLS:
            assert len(tool["description"]) > 10, (
                f"Tool {tool['name']} has too short a description"
            )

    def test_tool_names_are_unique(self):
        names = [t["name"] for t in ALL_TOOLS]
        assert len(names) == len(set(names)), f"Duplicate tool names: {names}"

    def test_tool_names_are_camel_case(self):
        for tool in ALL_TOOLS:
            name = tool["name"]
            # camelCase: starts with lowercase, no underscores
            assert name[0].islower(), f"Tool name '{name}' should start lowercase"
            assert "_" not in name, f"Tool name '{name}' should be camelCase, not snake_case"

    def test_required_fields_are_listed(self):
        for tool in ALL_TOOLS:
            schema = tool["input_schema"]
            if "required" in schema:
                props = set(schema["properties"].keys())
                required = set(schema["required"])
                assert required.issubset(props), (
                    f"Tool {tool['name']}: required fields {required - props} not in properties"
                )

    def test_dispatch_keys_match_schema_names(self):
        """Every tool schema name must have a matching TOOL_DISPATCH entry."""
        schema_names = {t["name"] for t in ALL_TOOLS}
        dispatch_names = set(TOOL_DISPATCH.keys())
        missing = schema_names - dispatch_names
        assert not missing, f"Tool schemas without dispatch handlers: {missing}"

    def test_dispatch_has_no_extra_keys(self):
        """TOOL_DISPATCH should not have keys that don't match any schema."""
        schema_names = {t["name"] for t in ALL_TOOLS}
        dispatch_names = set(TOOL_DISPATCH.keys())
        extra = dispatch_names - schema_names
        # Allow getBookingDetails as it's an alias
        extra.discard("getBookingDetails")
        assert not extra, f"TOOL_DISPATCH has extra keys not in schemas: {extra}"

    def test_specific_tools_exist(self):
        names = {t["name"] for t in ALL_TOOLS}
        expected = {
            "getTripSuggestions", "getTripItinerary", "getTripImages",
            "getHotelDetails", "getWeatherForecast", "compareTrips",
            "calculateCustomTrip", "customizeTrip", "applyDiscountCode",
            "validateUserDetails", "createBooking", "generatePaymentQR",
            "checkPaymentStatus", "cancelBooking", "modifyBooking",
            "getBookingDetails", "getPlaces", "getUpcomingFestivals",
            "estimateBudget", "getCurrencyRates",
        }
        assert names == expected

    def test_get_trip_suggestions_required_fields(self):
        tool = next(t for t in ALL_TOOLS if t["name"] == "getTripSuggestions")
        required = set(tool["input_schema"]["required"])
        assert required == {
            "mood", "environment", "duration_days",
            "people_count", "budget_usd", "departure_city", "language",
        }

    def test_create_booking_required_fields(self):
        tool = next(t for t in ALL_TOOLS if t["name"] == "createBooking")
        required = set(tool["input_schema"]["required"])
        expected = {
            "user_id", "trip_id", "travel_date", "end_date",
            "people_count", "pickup_location", "customer_name",
            "customer_phone", "customer_email",
        }
        assert required == expected
