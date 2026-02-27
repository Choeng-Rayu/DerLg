# QA-04 — Payment Flow Bug Tests

**Total tests:** 16  
**Key risk:** QR re-generated unnecessarily, expired hold not detected, payment confirmed before webhook, wrong booking_ref shown

---

## Background

Payment is where real money moves. A bug here is not an inconvenience — it is a financial incident. The riskiest behaviors are: the agent guessing payment status instead of checking, generating duplicate Stripe Payment Intents, silently losing the payment confirmation webhook, and not detecting when a 15-minute hold has expired before the user returns.

---

## TEST CASES

---

### PAY-001
**Risk:** 🔴 CRITICAL  
**Name:** Agent confirms payment success without webhook confirmation

**Precondition:** PAYMENT stage, QR shown, user claims payment completed

**Conversation:**
```
User: "I paid! The banking app said successful."
```

**Expected behavior:**
1. Agent calls `checkPaymentStatus(payment_intent_id=session.payment_intent_id)`
2. If status = SUCCEEDED → agent celebrates and shows booking confirmed card
3. If status = PENDING → agent says "It's still processing — give it 1–2 minutes and I'll confirm"
4. If status = FAILED → agent explains and offers new QR

**Bug prediction:**  
Agent trusts the user's claim. It skips `checkPaymentStatus` and says "Wonderful! Your booking DLG-2025-0042 is confirmed!" — but the payment actually failed (user misread the banking app). Booking remains unpaid and agent told user it's confirmed.

**Test:**
```python
async def test_pay001_never_confirm_without_webhook():
    session = payment_stage_session()
    
    # Mock: tool returns PENDING (payment not actually done)
    mock_check_payment.return_value = {
        "success": True,
        "data": {"status": "PENDING"}
    }
    
    response = await run_agent(session, "I paid! The banking app said successful.")
    
    # checkPaymentStatus MUST have been called
    assert mock_check_payment.called, \
        "Agent trusted user's claim without calling checkPaymentStatus"
    
    # Session must NOT have transitioned to POST_BOOKING
    assert session.state != AgentState.POST_BOOKING, \
        "Agent moved to POST_BOOKING on unconfirmed payment"
    
    # Response must NOT say "confirmed" or "booking is complete"
    confirmed_phrases = ["confirmed", "booking is complete", "all set", "you're booked"]
    for phrase in confirmed_phrases:
        assert phrase not in response['content'].lower(), \
            f"Agent confirmed payment without webhook: '{phrase}' found in response"
```

---

### PAY-002
**Risk:** 🔴 CRITICAL  
**Name:** Expired booking hold not detected — QR shown for dead booking

**Precondition:** PAYMENT stage. `reserved_until` was 20 minutes ago (hold expired)

**Conversation:**
```
User: "Ok I'm ready to pay now"
```

**Expected behavior:**
- Agent checks `session.reserved_until` against current UTC time
- Detects hold has expired
- Informs user: "Your booking hold expired 20 minutes ago. I can re-reserve the same trip — shall I do that?"
- Does NOT show the old QR (it's invalid — the Stripe Payment Intent has expired)
- Does NOT call `generatePaymentQR()` with the old `booking_id` (booking is cancelled)

**Bug prediction:**  
Agent does not check `reserved_until`. It shows the user the old expired QR code. User scans it. Stripe returns an error (Payment Intent expired). Banking app shows failure. User is confused — they were told to scan but it didn't work.

**Test:**
```python
async def test_pay002_expired_hold_detected():
    session = payment_stage_session()
    session.reserved_until = datetime.utcnow() - timedelta(minutes=20)
    session.booking_id = "booking-old-123"
    session.payment_intent_id = "pi_old_expired_456"
    
    response = await run_agent(session, "Ok I'm ready to pay now")
    
    # Must NOT call generatePaymentQR with the old expired intent
    if mock_generate_qr.called:
        call_kwargs = mock_generate_qr.call_args[0][0]
        assert call_kwargs.get('booking_id') != 'booking-old-123', \
            "Agent called generateQR with expired booking_id"
    
    # Must inform user about expiry
    expiry_phrases = ["expired", "held", "reserve again", "re-book", "time ran out"]
    assert any(p in response['content'].lower() for p in expiry_phrases), \
        "Agent did not inform user their booking hold expired"
    
    # Old booking data must be cleared
    assert session.booking_id != 'booking-old-123' or session.state == AgentState.BOOKING
```

---

### PAY-003
**Risk:** 🔴 CRITICAL  
**Name:** payment_attempts >= 3 still generates new QR

**Precondition:** PAYMENT stage, `session.payment_attempts = 3`

**Conversation:**
```
User: "It failed again, please try one more time"
```

**Expected behavior:**
- Agent does NOT call `generatePaymentQR()` for a 4th attempt
- Agent says: "We've had 3 failed payment attempts. For security, I can't generate more QR codes automatically. Please contact our support team at support@derlg.com or +855 12 345 678 — they'll help you complete this quickly. Your booking details are saved."
- Support contact info is clearly provided

**Bug prediction:**  
Agent generates a 4th QR. The user has a fraudulent card or something wrong with their account. Generating unlimited QR codes is a security risk and creates multiple dangling Stripe Payment Intents.

**Test:**
```python
async def test_pay003_no_qr_after_3_failures():
    session = payment_stage_session()
    session.payment_attempts = 3
    
    response = await run_agent(session, "It failed again, please try one more time")
    
    assert not mock_generate_qr.called, \
        "generatePaymentQR was called after 3 failed attempts (attempt 4)"
    
    # Must provide support contact
    support_indicators = ["support", "contact", "@derlg.com", "+855", "help"]
    assert any(s in response['content'].lower() for s in support_indicators), \
        "Agent did not provide support contact after max payment attempts"
```

---

### PAY-004
**Risk:** 🟡 High  
**Name:** generatePaymentQR uses wrong booking_id

**Precondition:** User has two recent sessions — one old cancelled booking, one new active booking

**Setup:**
- Old session had `booking_id = "booking-old-111"` (cancelled)
- New booking created: `booking_id = "booking-new-222"`
- `session.booking_id` should be `"booking-new-222"`

**Bug prediction:**  
If session state is not cleanly updated after re-booking, `booking_id` still holds the old value. `generatePaymentQR("booking-old-111")` is called. Backend returns error (booking cancelled). User sees an error instead of a QR.

**Test:**
```python
async def test_pay004_qr_uses_correct_booking_id():
    session = payment_stage_session()
    session.booking_id = "booking-new-222"  # correct new booking
    
    # Simulate: old booking_id leaked into session somehow
    # (this is the bug scenario — we're testing it doesn't happen)
    
    await run_agent(session, "Show me the payment QR")
    
    if mock_generate_qr.called:
        call_args = mock_generate_qr.call_args[0][0]
        assert call_args['booking_id'] == 'booking-new-222', \
            f"QR generated for wrong booking_id: {call_args['booking_id']}"
```

---

### PAY-005
**Risk:** 🟡 High  
**Name:** Payment webhook arrives while user is actively chatting — race condition

**Precondition:** PAYMENT stage. User is asking questions while Stripe webhook fires

**Scenario:**
- T=0: User sends "Is this QR still valid?"
- T=0.1: Stripe webhook fires → Redis publishes payment_events
- T=0.2: Agent is mid-processing user's question
- T=0.3: Webhook listener receives event, tries to update session and push to WebSocket

**Expected behavior:**
- User sees their question answered ("Yes, your QR is valid for X more minutes")
- THEN immediately sees the payment confirmation card
- Session ends in POST_BOOKING
- No duplicate confirmations sent

**Bug prediction:**  
Both the agent response and the webhook response try to send to the WebSocket at the same moment. Either one of them fails silently, or the user sees two simultaneous responses in the wrong order (confirmation before the question answer), or session.state is corrupted.

**Test:**
```python
async def test_pay005_webhook_race_condition():
    session = payment_stage_session()
    messages_sent = []
    
    async def mock_ws_send(data):
        messages_sent.append(data)
        await asyncio.sleep(0)  # yield to event loop
    
    # Start agent processing a question
    agent_task = asyncio.create_task(
        handle_websocket_message(session, "Is this QR still valid?", mock_ws_send)
    )
    
    # Fire payment webhook concurrently
    await asyncio.sleep(0.05)  # small delay to create race
    webhook_task = asyncio.create_task(
        handle_payment_webhook(session, "pi_test_123", "SUCCEEDED", mock_ws_send)
    )
    
    await asyncio.gather(agent_task, webhook_task)
    
    # Verify: no duplicate confirmations
    confirmation_msgs = [m for m in messages_sent if m.get('type') == 'booking_confirmed']
    assert len(confirmation_msgs) <= 1, \
        f"Duplicate booking confirmations sent: {len(confirmation_msgs)}"
    
    # Verify: final state is POST_BOOKING
    assert session.state == AgentState.POST_BOOKING
```

---

### PAY-006
**Risk:** 🟡 High  
**Name:** Wrong currency amount shown in QR card

**Precondition:** User's preferred currency display is KHR

**Setup:** Booking total is $182.20 USD. Exchange rate: 1 USD = 4,095 KHR

**Expected behavior:**
- QR card shows: `$182.20 USD` (primary)
- Below: `≈ 746,109 KHR` (secondary, live rate)
- Amount charged via Stripe is always USD (never KHR)

**Bug prediction:**  
Exchange rate API is stale (cached). Rate shows as 4,000 KHR (wrong). User transfers 728,800 KHR thinking it covers the $182.20. Actual payment goes through fine (charged in USD via Stripe) but user is confused by the displayed mismatch.

More severe bug: Agent displays KHR amount as if it's the CHARGED amount. User only transfers KHR to their ABA account, expects that to cover it. Stripe charges USD. Payment fails because Bakong QR and Stripe QR are shown interchangeably.

**Test:**
```python
async def test_pay006_currency_display_accurate():
    session = payment_stage_session()
    session.preferred_language = "KH"
    
    mock_currency_rates.return_value = {
        "success": True,
        "data": {"USD_to_KHR": 4095.5, "USD_to_CNY": 7.25}
    }
    
    response = await run_agent(session, "Show me the payment QR")
    
    # Find the QR message
    qr_message = next((m for m in response if m.get('type') == 'payment_qr'), None)
    assert qr_message is not None
    
    # KHR amount must match: 182.20 * 4095.5 = 746,199 (approx)
    khr_amount = qr_message.get('amount_khr')
    expected_khr = round(182.20 * 4095.5)
    assert abs(khr_amount - expected_khr) < 1000, \
        f"KHR amount {khr_amount} doesn't match expected {expected_khr}"
```

---

### PAY-007
**Risk:** 🟡 High  
**Name:** Loyalty points deducted before payment confirmed

**Precondition:** User applied 500 loyalty points ($5 off) at booking stage

**Expected behavior:**
- Points are NOT deducted from user's balance at booking time
- Points are deducted ONLY when payment is confirmed (webhook)
- If payment fails and user cancels: points are NOT deducted at all

**Bug prediction:**  
Points are deducted at `createBooking()` time. Payment then fails. Points are gone but booking never confirmed. User contacts support angry that they lost points.

**Test:**
```python
async def test_pay007_points_deducted_only_on_payment_success():
    # Check that the booking creation payload notes points to use
    # but points balance is NOT yet reduced
    session = customization_stage_session()
    session.loyalty_points_to_use = 500
    
    # Create booking
    await run_agent(session, "Yes, book it")
    await run_agent(session, "Chan Dara")
    await run_agent(session, "+855 12 345 678")
    await run_agent(session, "PP Airport")
    
    # At this point booking is RESERVED, not CONFIRMED
    # Points must NOT be deducted yet
    assert mock_deduct_points.called == False, \
        "Loyalty points deducted before payment confirmed"
    
    # Now simulate payment failure
    # Points must remain intact
    assert session.loyalty_points_to_use == 500  # still tracked in session
```

---

### PAY-008 through PAY-016 — Additional Payment Tests

**PAY-008:** QR card displays booking_ref correctly  
After `createBooking()` succeeds, QR card must show `session.booking_ref` (e.g., "DLG-2025-0042"). If `session.booking_ref` is None (not yet set), QR must NOT show "None" or an empty field.

**PAY-009:** Agent handles Stripe Payment Intent amount mismatch  
Backend recalculates price at $182 but user was told $185 by agent. Stripe PI is created for $182. QR card must show $182 (the authoritative server price), not the stale $185 the agent mentioned earlier.

**PAY-010:** "Generate New QR" is called when user explicitly requests it  
```User: "The QR isn't working. Can you generate a new one?"```  
Agent MUST call `generatePaymentQR()`. This is one of the two allowed triggers for re-generation.

**PAY-011:** Simultaneous QR generation for same booking  
If two WebSocket connections for the same session both call `generatePaymentQR()` within 100ms, only one new Stripe Payment Intent should be created. The second call must detect the first is in progress.

**PAY-012:** POST_BOOKING reached without `booking_ref` in session  
If `session.booking_ref` is None when transitioning to POST_BOOKING, agent must log an error and NOT tell the user their booking is confirmed (because we can't give them a reference number).

**PAY-013:** Agent response when payment is in PROCESSING state  
`checkPaymentStatus` returns status="PROCESSING" (bank is processing, not yet SUCCEEDED).  
Agent must say "Still processing — usually takes 1–2 minutes." Does NOT say "confirmed" or "failed."

**PAY-014:** User changes payment method mid-flow  
User sees QR, says "Actually I want to pay by card instead."  
Agent must: acknowledge, help user navigate to card input, NOT generate a new QR unnecessarily.

**PAY-015:** Currency display toggle mid-conversation  
User: "Show the total in KHR"  
Agent updates currency display preference in session. Subsequent amount mentions use KHR. Does not affect what Stripe charges (always USD).

**PAY-016:** User sends QR screenshot to another person who tries to use it  
Second person tries to use the same QR → Stripe rejects (already used or wrong account). Agent in the second session must handle the error gracefully, not crash.