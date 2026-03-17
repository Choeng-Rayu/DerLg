"""Anthropic tool-calling schemas for all 20 DerLg AI agent tools.

Each schema follows Anthropic's tool format with ``name``, ``description``,
and ``input_schema`` (JSON Schema).  The ``ALL_TOOLS`` list at the bottom is
the single source of truth passed to ``client.messages.create(tools=...)``.

Reference: /docs/agentic_chatbots_llm/14-ai-tools-api.md
"""

# ---------------------------------------------------------------------------
# 1. Discovery & Suggestions
# ---------------------------------------------------------------------------

GET_TRIP_SUGGESTIONS = {
    "name": "getTripSuggestions",
    "description": (
        "Return 3 trip package suggestions based on collected user preferences. "
        "Selects the best match, most affordable, and premium option from active "
        "trips filtered by environment, duration, and budget range. Results are "
        "localized to the requested language. Only call this after ALL 6 discovery "
        "fields (mood, environment, duration_days, people_count, budget_usd, "
        "departure_city) have been confirmed with the user."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "mood": {
                "type": "string",
                "description": "The traveler's mood or desired experience type.",
                "enum": [
                    "stressed",
                    "adventurous",
                    "romantic",
                    "curious",
                    "family",
                ],
            },
            "environment": {
                "type": "string",
                "description": "The type of destination environment the traveler prefers.",
                "enum": [
                    "MOUNTAIN",
                    "BEACH",
                    "CITY",
                    "FOREST",
                    "ISLAND",
                    "TEMPLE",
                ],
            },
            "duration_days": {
                "type": "integer",
                "description": "Number of days for the trip (1-30).",
                "minimum": 1,
                "maximum": 30,
            },
            "people_count": {
                "type": "integer",
                "description": "Number of people traveling (1-50).",
                "minimum": 1,
                "maximum": 50,
            },
            "budget_usd": {
                "type": "object",
                "description": "Budget range per person in USD.",
                "properties": {
                    "min": {
                        "type": "number",
                        "description": "Minimum budget per person in USD.",
                    },
                    "max": {
                        "type": "number",
                        "description": "Maximum budget per person in USD.",
                    },
                },
                "required": ["min", "max"],
            },
            "departure_city": {
                "type": "string",
                "description": "The city the traveler is departing from (e.g. 'Phnom Penh').",
            },
            "language": {
                "type": "string",
                "description": "Response language for localized titles and descriptions.",
                "enum": ["EN", "KH", "ZH"],
            },
        },
        "required": [
            "mood",
            "environment",
            "duration_days",
            "people_count",
            "budget_usd",
            "departure_city",
            "language",
        ],
    },
}

GET_TRIP_ITINERARY = {
    "name": "getTripItinerary",
    "description": (
        "Return the full day-by-day itinerary for a specific trip. Each day "
        "includes morning, afternoon, and evening activities, meals included, "
        "and transport details. Use when the user asks to see what a trip "
        "includes or wants the detailed schedule."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "trip_id": {
                "type": "string",
                "description": "UUID of the trip to retrieve the itinerary for.",
            },
        },
        "required": ["trip_id"],
    },
}

GET_TRIP_IMAGES = {
    "name": "getTripImages",
    "description": (
        "Return a gallery of photos for a specific trip including destination "
        "scenery, hotel, transport, and activity images. Use when the user "
        "asks to see photos or wants a visual preview of a trip option."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "trip_id": {
                "type": "string",
                "description": "UUID of the trip to retrieve images for.",
            },
        },
        "required": ["trip_id"],
    },
}

GET_HOTEL_DETAILS = {
    "name": "getHotelDetails",
    "description": (
        "Return full hotel details including name, star rating, amenities, "
        "all room types with pricing, photos, and check-in/check-out policy. "
        "Use when the user asks about the hotel, accommodation, or room options "
        "for a trip."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "hotel_id": {
                "type": "string",
                "description": "UUID of the hotel to retrieve details for.",
            },
        },
        "required": ["hotel_id"],
    },
}

GET_WEATHER_FORECAST = {
    "name": "getWeatherForecast",
    "description": (
        "Return a 7-day weather forecast for a Cambodian destination. Includes "
        "daily condition, high/low temperature, humidity, rain chance, and a "
        "travel recommendation. Data is cached for 1 hour in Redis. Always call "
        "this tool for weather questions instead of guessing from general knowledge."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "destination": {
                "type": "string",
                "description": (
                    "Name of the destination city or province "
                    "(e.g. 'Siem Reap', 'Sihanoukville', 'Phnom Penh')."
                ),
            },
            "date": {
                "type": "string",
                "description": (
                    "Target date for the forecast in ISO 8601 format "
                    "(YYYY-MM-DD). If omitted, returns forecast starting from today."
                ),
            },
        },
        "required": ["destination"],
    },
}

COMPARE_TRIPS = {
    "name": "compareTrips",
    "description": (
        "Return a structured side-by-side comparison of 2 to 3 trip options. "
        "Compares price, duration, inclusions, highlights, and ratings. Use "
        "when the user asks to compare trips or cannot decide between options."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "trip_ids": {
                "type": "array",
                "description": "Array of 2-3 trip UUIDs to compare.",
                "items": {"type": "string"},
                "minItems": 2,
                "maxItems": 3,
            },
        },
        "required": ["trip_ids"],
    },
}

# ---------------------------------------------------------------------------
# 2. Customization
# ---------------------------------------------------------------------------

CALCULATE_CUSTOM_TRIP = {
    "name": "calculateCustomTrip",
    "description": (
        "Recalculate the total price for a trip when the user changes duration, "
        "people count, or adds extras. Returns a full price breakdown including "
        "base price, add-ons, and the new total. Use when the user asks "
        "'how much would it be if...' or modifies trip parameters."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "base_trip_id": {
                "type": "string",
                "description": "UUID of the base trip to recalculate pricing for.",
            },
            "customizations": {
                "type": "array",
                "description": (
                    "List of customization objects describing changes to apply."
                ),
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "description": "Type of customization.",
                            "enum": [
                                "people_count",
                                "duration_override",
                                "add_on",
                            ],
                        },
                        "value": {
                            "description": (
                                "Value for the customization: integer for "
                                "people_count/duration_override, string code "
                                "for add_on (e.g. 'private_dinner', "
                                "'hotel_upgrade', 'sunset_cruise')."
                            ),
                        },
                    },
                    "required": ["type", "value"],
                },
            },
        },
        "required": ["base_trip_id", "customizations"],
    },
}

CUSTOMIZE_TRIP = {
    "name": "customizeTrip",
    "description": (
        "Apply add-ons, remove items, or upgrade transport for a selected trip "
        "and return the updated pricing and inclusions. Available add-ons "
        "include: private_dinner, hotel_upgrade, sunset_cruise, guide_english, "
        "guide_chinese, extra_night, airport_transfer. Use when the user wants "
        "to personalize their selected trip."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "trip_id": {
                "type": "string",
                "description": "UUID of the trip to customize.",
            },
            "customizations": {
                "type": "array",
                "description": "List of customization actions to apply to the trip.",
                "items": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "description": "Whether to add or remove this item.",
                            "enum": ["add", "remove"],
                        },
                        "item": {
                            "type": "string",
                            "description": (
                                "The add-on or item code: 'private_dinner', "
                                "'hotel_upgrade', 'sunset_cruise', "
                                "'guide_english', 'guide_chinese', "
                                "'extra_night', 'airport_transfer', or a "
                                "transport upgrade code like 'ALPHARD'."
                            ),
                        },
                    },
                    "required": ["action", "item"],
                },
            },
        },
        "required": ["trip_id", "customizations"],
    },
}

APPLY_DISCOUNT_CODE = {
    "name": "applyDiscountCode",
    "description": (
        "Validate and apply a discount code to a booking. Returns whether the "
        "code is valid, the discount type (percent or fixed), the discount "
        "amount, and the new total. If invalid, returns a user-friendly "
        "error message explaining why."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "The discount code entered by the user (e.g. 'FESTIVAL10', 'BEACH20').",
            },
            "booking_id": {
                "type": "string",
                "description": "UUID of the booking to apply the discount code to.",
            },
        },
        "required": ["code", "booking_id"],
    },
}

# ---------------------------------------------------------------------------
# 3. Booking
# ---------------------------------------------------------------------------

VALIDATE_USER_DETAILS = {
    "name": "validateUserDetails",
    "description": (
        "Validate collected user details before creating a booking. Checks "
        "name format, phone number format, and email format. Returns "
        "field-level validation errors if any input is invalid. Always call "
        "this before createBooking to catch formatting issues early."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Full name of the customer for the booking.",
            },
            "phone": {
                "type": "string",
                "description": "Phone number of the customer (e.g. '+855 12 345 678').",
            },
            "email": {
                "type": "string",
                "description": "Email address of the customer.",
            },
        },
        "required": ["name", "phone", "email"],
    },
}

CREATE_BOOKING = {
    "name": "createBooking",
    "description": (
        "Create a booking reservation with a 15-minute payment hold. Validates "
        "all input IDs, checks availability for the requested dates, "
        "recalculates the total price server-side, and sets the booking status "
        "to RESERVED. The returned booking_id and reserved_until timestamp must "
        "be stored in the session. NEVER call this before completing the booking "
        "confirmation summary and collecting all personal details."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "user_id": {
                "type": "string",
                "description": "UUID of the authenticated user creating the booking.",
            },
            "trip_id": {
                "type": "string",
                "description": "UUID of the selected trip package.",
            },
            "travel_date": {
                "type": "string",
                "description": "Start date of the trip in ISO 8601 format (YYYY-MM-DD). Must be at least 24 hours from now.",
            },
            "end_date": {
                "type": "string",
                "description": "End date of the trip in ISO 8601 format (YYYY-MM-DD).",
            },
            "people_count": {
                "type": "integer",
                "description": "Number of people traveling (1-50).",
                "minimum": 1,
                "maximum": 50,
            },
            "pickup_location": {
                "type": "string",
                "description": "Pickup address or landmark (e.g. 'Phnom Penh International Airport, Terminal 1').",
            },
            "customer_name": {
                "type": "string",
                "description": "Full name of the primary traveler for the booking.",
            },
            "customer_phone": {
                "type": "string",
                "description": "Phone number for driver contact (e.g. '+855 12 345 678').",
            },
            "customer_email": {
                "type": "string",
                "description": "Email address for booking confirmation and receipts.",
            },
            "special_requests": {
                "type": "string",
                "description": "Optional special requests such as dietary needs, accessibility requirements, or other notes.",
            },
            "discount_code": {
                "type": "string",
                "description": "Optional discount code to apply to this booking.",
            },
        },
        "required": [
            "user_id",
            "trip_id",
            "travel_date",
            "end_date",
            "people_count",
            "pickup_location",
            "customer_name",
            "customer_phone",
            "customer_email",
        ],
    },
}

# ---------------------------------------------------------------------------
# 4. Payment
# ---------------------------------------------------------------------------

GENERATE_PAYMENT_QR = {
    "name": "generatePaymentQR",
    "description": (
        "Create a Stripe Payment Intent and generate a QR code URL for display "
        "in the chat. The booking must be in RESERVED status with the hold not "
        "yet expired. Returns the QR image URL, payment amount, and expiry "
        "timestamp. Do NOT call this more than once unless the user reports a "
        "problem or the timer has expired."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "booking_id": {
                "type": "string",
                "description": "UUID of the reserved booking to generate payment for.",
            },
            "user_id": {
                "type": "string",
                "description": "UUID of the authenticated user making the payment.",
            },
        },
        "required": ["booking_id", "user_id"],
    },
}

CHECK_PAYMENT_STATUS = {
    "name": "checkPaymentStatus",
    "description": (
        "Check the current payment status for a given payment intent. Returns "
        "SUCCEEDED, PENDING, FAILED, or CANCELLED along with the booking "
        "reference and amount. Always call this when the user asks 'did my "
        "payment go through?' instead of guessing. Never confirm payment "
        "success without calling this tool first."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "payment_intent_id": {
                "type": "string",
                "description": "Stripe Payment Intent ID (e.g. 'pi_3xxx') to check status for.",
            },
        },
        "required": ["payment_intent_id"],
    },
}

# ---------------------------------------------------------------------------
# 5. Post-Booking Management
# ---------------------------------------------------------------------------

CANCEL_BOOKING = {
    "name": "cancelBooking",
    "description": (
        "Cancel a confirmed booking and trigger the refund logic per the "
        "cancellation policy. Calculates refund amount based on how far in "
        "advance the cancellation is (7+ days = full refund, 1-7 days = 50%%, "
        "under 24 hours = no refund). Reverses any loyalty points earned. "
        "NEVER call this without first stating the exact refund amount to the "
        "user and receiving explicit confirmation."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "booking_id": {
                "type": "string",
                "description": "UUID of the booking to cancel.",
            },
        },
        "required": ["booking_id"],
    },
}

MODIFY_BOOKING = {
    "name": "modifyBooking",
    "description": (
        "Modify an existing confirmed booking. Supports rescheduling to new "
        "dates, changing people count, or updating other booking details. "
        "Checks availability for new dates and recalculates pricing. If the "
        "new price is higher, a supplemental payment will be required."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "booking_id": {
                "type": "string",
                "description": "UUID of the booking to modify.",
            },
            "modifications": {
                "type": "object",
                "description": "Object containing the fields to modify.",
                "properties": {
                    "new_travel_date": {
                        "type": "string",
                        "description": "New start date in ISO 8601 format (YYYY-MM-DD).",
                    },
                    "new_end_date": {
                        "type": "string",
                        "description": "New end date in ISO 8601 format (YYYY-MM-DD).",
                    },
                    "new_people_count": {
                        "type": "integer",
                        "description": "Updated number of travelers.",
                        "minimum": 1,
                        "maximum": 50,
                    },
                    "new_pickup_location": {
                        "type": "string",
                        "description": "Updated pickup address or landmark.",
                    },
                    "new_special_requests": {
                        "type": "string",
                        "description": "Updated special requests or notes.",
                    },
                },
            },
        },
        "required": ["booking_id", "modifications"],
    },
}

GET_BOOKING_DETAILS = {
    "name": "getBookingDetails",
    "description": (
        "Retrieve full details for an active booking including trip information, "
        "hotel, vehicle, guide, payment status, itinerary, and contact details. "
        "Use when the user asks about their booking, wants a summary, or in the "
        "POST_BOOKING stage when providing travel companion support."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "booking_id": {
                "type": "string",
                "description": "UUID of the booking to retrieve details for.",
            },
        },
        "required": ["booking_id"],
    },
}

# ---------------------------------------------------------------------------
# 6. Explore & AI Budget Planner
# ---------------------------------------------------------------------------

GET_PLACES = {
    "name": "getPlaces",
    "description": (
        "Search for historical, cultural, and natural places in Cambodia. "
        "Returns place objects with name, description, visitor tips, "
        "coordinates, images, entry fee, and opening hours. Use when the user "
        "asks about specific places, temples, or attractions."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "description": "Category of places to search for.",
                "enum": [
                    "TEMPLE",
                    "BEACH",
                    "MOUNTAIN",
                    "MUSEUM",
                    "MARKET",
                    "NATIONAL_PARK",
                    "WATERFALL",
                    "HISTORICAL",
                    "CULTURAL",
                ],
            },
            "region": {
                "type": "string",
                "description": (
                    "Optional province or region to filter results "
                    "(e.g. 'Siem Reap', 'Phnom Penh', 'Sihanoukville')."
                ),
            },
            "language": {
                "type": "string",
                "description": "Response language for localized place names and descriptions.",
                "enum": ["EN", "KH", "ZH"],
            },
        },
        "required": ["category", "language"],
    },
}

GET_UPCOMING_FESTIVALS = {
    "name": "getUpcomingFestivals",
    "description": (
        "Return upcoming Cambodian festivals and events within a date range. "
        "Useful for travel recommendations and alerts about busy periods, "
        "road closures, or unique cultural experiences the traveler should "
        "not miss."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "start_date": {
                "type": "string",
                "description": "Start of the date range in ISO 8601 format (YYYY-MM-DD).",
            },
            "end_date": {
                "type": "string",
                "description": "End of the date range in ISO 8601 format (YYYY-MM-DD).",
            },
            "language": {
                "type": "string",
                "description": "Response language for festival names and descriptions.",
                "enum": ["EN", "KH", "ZH"],
            },
        },
        "required": ["start_date", "end_date", "language"],
    },
}

ESTIMATE_BUDGET = {
    "name": "estimateBudget",
    "description": (
        "AI Budget Planner that estimates total trip cost before any booking. "
        "Returns a min/max cost range with a full breakdown by category "
        "(accommodation, transport, guide, meals, entry fees) and currency "
        "equivalents in KHR and CNY. Also includes contextual money-saving tips."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "trip_type": {
                "type": "string",
                "description": "The accommodation and comfort tier for the estimate.",
                "enum": ["BUDGET", "MID", "LUXURY"],
            },
            "duration_days": {
                "type": "integer",
                "description": "Number of days for the trip estimate (1-30).",
                "minimum": 1,
                "maximum": 30,
            },
            "people_count": {
                "type": "integer",
                "description": "Number of people traveling (1-50).",
                "minimum": 1,
                "maximum": 50,
            },
        },
        "required": ["trip_type", "duration_days", "people_count"],
    },
}

GET_CURRENCY_RATES = {
    "name": "getCurrencyRates",
    "description": (
        "Get live currency exchange rates between two currencies. Commonly "
        "used to convert between USD, KHR (Cambodian Riel), and CNY (Chinese "
        "Yuan). Use when the user asks about exchange rates or wants to know "
        "prices in a different currency."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "from_currency": {
                "type": "string",
                "description": "Source currency code (e.g. 'USD', 'KHR', 'CNY').",
            },
            "to_currency": {
                "type": "string",
                "description": "Target currency code (e.g. 'USD', 'KHR', 'CNY').",
            },
        },
        "required": ["from_currency", "to_currency"],
    },
}

# ---------------------------------------------------------------------------
# Aggregated tool list
# ---------------------------------------------------------------------------

ALL_TOOLS: list[dict] = [
    # Discovery & Suggestions
    GET_TRIP_SUGGESTIONS,
    GET_TRIP_ITINERARY,
    GET_TRIP_IMAGES,
    GET_HOTEL_DETAILS,
    GET_WEATHER_FORECAST,
    COMPARE_TRIPS,
    # Customization
    CALCULATE_CUSTOM_TRIP,
    CUSTOMIZE_TRIP,
    APPLY_DISCOUNT_CODE,
    # Booking
    VALIDATE_USER_DETAILS,
    CREATE_BOOKING,
    # Payment
    GENERATE_PAYMENT_QR,
    CHECK_PAYMENT_STATUS,
    # Post-Booking Management
    CANCEL_BOOKING,
    MODIFY_BOOKING,
    GET_BOOKING_DETAILS,
    # Explore & Budget Planner
    GET_PLACES,
    GET_UPCOMING_FESTIVALS,
    ESTIMATE_BUDGET,
    GET_CURRENCY_RATES,
]

# Alias used by the agent loop (agent/agent.py)
TRAVEL_TOOLS: list[dict] = ALL_TOOLS
