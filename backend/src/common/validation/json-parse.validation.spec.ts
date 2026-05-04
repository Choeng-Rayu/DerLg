import fc from 'fast-check';
import {
  parseBookingCustomizations,
  parseCancellationPolicy,
  parseTripItinerary,
} from './json-parse.validation.js';

const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0);

const validBookingCustomizationsArb = fc.record({
  pickup: fc.record({
    location: nonEmptyStringArb,
    time: nonEmptyStringArb,
  }),
  dietaryRequirements: fc.array(nonEmptyStringArb, { maxLength: 5 }),
  accessibilityNeeds: fc.array(nonEmptyStringArb, { maxLength: 5 }),
  specialRequests: fc.array(nonEmptyStringArb, { maxLength: 5 }),
});

const validTripItineraryArb = fc.record({
  days: fc.array(
    fc.record({
      day: fc.integer({ min: 1, max: 30 }),
      date: nonEmptyStringArb,
      activities: fc.array(
        fc.record({
          title: nonEmptyStringArb,
          startTime: fc.option(nonEmptyStringArb, { nil: undefined }),
          location: fc.option(nonEmptyStringArb, { nil: undefined }),
        }),
        { minLength: 1, maxLength: 8 },
      ),
    }),
    { minLength: 1, maxLength: 14 },
  ),
});

const validCancellationPolicyArb = fc.record({
  rules: fc.array(
    fc.record({
      daysBefore: fc.integer({ min: 0, max: 365 }),
      refundPercent: fc.integer({ min: 0, max: 100 }),
    }),
    { minLength: 1, maxLength: 6 },
  ),
  noShowPenaltyPercent: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
});

describe('Property 54: JSON validation on parse', () => {
  it('accepts valid booking customizations as object and JSON string', () => {
    fc.assert(
      fc.property(validBookingCustomizationsArb, (input) => {
        expect(parseBookingCustomizations(input)).toBeDefined();
        expect(parseBookingCustomizations(JSON.stringify(input))).toBeDefined();
      }),
      { numRuns: 150 },
    );
  });

  it('accepts valid trip itinerary as object and JSON string', () => {
    fc.assert(
      fc.property(validTripItineraryArb, (input) => {
        expect(parseTripItinerary(input)).toBeDefined();
        expect(parseTripItinerary(JSON.stringify(input))).toBeDefined();
      }),
      { numRuns: 150 },
    );
  });

  it('accepts valid cancellation policy as object and JSON string', () => {
    fc.assert(
      fc.property(validCancellationPolicyArb, (input) => {
        expect(parseCancellationPolicy(input)).toBeDefined();
        expect(parseCancellationPolicy(JSON.stringify(input))).toBeDefined();
      }),
      { numRuns: 150 },
    );
  });

  it('rejects invalid booking customizations with field location', () => {
    fc.assert(
      fc.property(validBookingCustomizationsArb, (input) => {
        const invalid = {
          ...input,
          pickup: {
            ...input.pickup,
            time: 123,
          },
        };

        expect(() => parseBookingCustomizations(invalid)).toThrow(/bookingCustomizations\.pickup\.time/);
      }),
      { numRuns: 120 },
    );
  });

  it('rejects invalid trip itinerary with field location', () => {
    fc.assert(
      fc.property(validTripItineraryArb, (input) => {
        const invalid = {
          ...input,
          days: [
            {
              ...input.days[0],
              activities: 'invalid',
            },
            ...input.days.slice(1),
          ],
        };

        expect(() => parseTripItinerary(invalid)).toThrow(/tripItinerary\.days\.0\.activities/);
      }),
      { numRuns: 120 },
    );
  });

  it('rejects invalid cancellation policy with field location', () => {
    fc.assert(
      fc.property(validCancellationPolicyArb, (input) => {
        const invalid = {
          ...input,
          rules: [
            {
              ...input.rules[0],
              refundPercent: 120,
            },
            ...input.rules.slice(1),
          ],
        };

        expect(() => parseCancellationPolicy(invalid)).toThrow(/cancellationPolicy\.rules\.0\.refundPercent/);
      }),
      { numRuns: 120 },
    );
  });

  it('rejects malformed JSON strings with descriptive location', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, (raw) => {
        fc.pre(!raw.trim().startsWith('{') && !raw.trim().startsWith('['));
        expect(() => parseBookingCustomizations(raw)).toThrow(/bookingCustomizations/);
        expect(() => parseTripItinerary(raw)).toThrow(/tripItinerary/);
        expect(() => parseCancellationPolicy(raw)).toThrow(/cancellationPolicy/);
      }),
      { numRuns: 80 },
    );
  });
});
