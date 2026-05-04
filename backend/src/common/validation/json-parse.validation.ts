import { z, type ZodType } from 'zod';

export const bookingCustomizationsSchema = z
  .object({
    pickup: z
      .object({
        location: z.string().min(1),
        time: z.string().min(1),
      })
      .optional(),
    dietaryRequirements: z.array(z.string().min(1)).max(20).optional(),
    accessibilityNeeds: z.array(z.string().min(1)).max(20).optional(),
    specialRequests: z.array(z.string().min(1)).max(20).optional(),
  })
  .strict();

export const tripItinerarySchema = z
  .object({
    days: z
      .array(
        z
          .object({
            day: z.number().int().positive(),
            date: z.string().min(1),
            activities: z
              .array(
                z
                  .object({
                    title: z.string().min(1),
                    startTime: z.string().min(1).optional(),
                    location: z.string().min(1).optional(),
                  })
                  .strict(),
              )
              .min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const cancellationPolicySchema = z
  .object({
    rules: z
      .array(
        z
          .object({
            daysBefore: z.number().int().nonnegative(),
            refundPercent: z.number().min(0).max(100),
          })
          .strict(),
      )
      .min(1),
    noShowPenaltyPercent: z.number().min(0).max(100).optional(),
  })
  .strict();

type JsonInput = unknown;

function parseAndValidateJson<T>(
  fieldName: string,
  value: JsonInput,
  schema: ZodType<T>,
): T {
  let payload: unknown = value;

  if (typeof value === 'string') {
    try {
      payload = JSON.parse(value);
    } catch {
      throw new Error(`Invalid ${fieldName} at ${fieldName}: malformed JSON`);
    }
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path.length > 0 ? `${fieldName}.${issue.path.join('.')}` : fieldName;
    throw new Error(`Invalid ${fieldName} at ${path}: ${issue.message}`);
  }

  return parsed.data;
}

export function parseBookingCustomizations(value: JsonInput) {
  return parseAndValidateJson('bookingCustomizations', value, bookingCustomizationsSchema);
}

export function parseTripItinerary(value: JsonInput) {
  return parseAndValidateJson('tripItinerary', value, tripItinerarySchema);
}

export function parseCancellationPolicy(value: JsonInput) {
  return parseAndValidateJson('cancellationPolicy', value, cancellationPolicySchema);
}
