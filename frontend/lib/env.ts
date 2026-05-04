import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_WS_URL: z.string().default('ws://localhost:8000/ws'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().default('USD'),
  NEXT_PUBLIC_ENABLE_PWA: z.string().default('true'),
  NEXT_PUBLIC_IMAGE_CDN_HOST: z.string().optional(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
  NEXT_PUBLIC_ENABLE_PWA: process.env.NEXT_PUBLIC_ENABLE_PWA,
  NEXT_PUBLIC_IMAGE_CDN_HOST: process.env.NEXT_PUBLIC_IMAGE_CDN_HOST,
})
