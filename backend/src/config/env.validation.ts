import { z } from 'zod'

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // PostgreSQL
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Redis
  REDIS_URL: z.string().url(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // AI Service
  AI_SERVICE_KEY: z.string().min(16),

  // Resend email
  RESEND_API_KEY: z.string().startsWith('re_').optional(),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),

  // Exchange rates (optional)
  EXCHANGE_RATE_API_KEY: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(
      `❌ Environment validation failed. Fix the following:\n${errors}`,
    )
  }

  return result.data
}
