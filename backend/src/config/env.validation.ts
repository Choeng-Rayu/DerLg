import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

/**
 * Load local environment variables explicitly from the .env file.
 * This ensures we are validating the specific "custom-env" from @backend/.env
 */
dotenvConfig({ path: join(process.cwd(), '.env') });

/**
 * Environment variables schema definition using Zod.
 * This ensures all required variables are present and correctly formatted
 * before the application starts.
 * 
 * Note: Per project requirements, local DATABASE_URL and REDIS_URL are prohibited;
 * they must point to Supabase and Upstash respectively.
 */
const envSchema = z.object({
  // --- Server Configuration ---
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3001),
  APP_STAGE: z.enum(['dev', 'test', 'staging', 'production']).default('dev'),

  // --- Database (Supabase PostgreSQL) ---
  // Must be a remote Supabase URL, not localhost
  DATABASE_URL: z
    .url()
    .startsWith("postgresql://")
    .refine(
      (url) => !url.includes("localhost") && !url.includes("127.0.0.1"),
      { error: "DATABASE_URL must be a remote Supabase URL, not local." }
    ),

  DIRECT_URL: z
    .url()
    .startsWith('postgresql://')
    .refine(url => !url.includes('localhost') && !url.includes('127.0.0.1'), {
      message: "DIRECT_URL must be a remote Supabase URL, not local.",
    }),
  
  // --- Supabase Service Configuration ---
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // --- Monitoring & Logging ---
  SENTRY_DSN: z.url().optional(),
  
  // --- Security & Authentication ---
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(20).default(12),

  // --- Caching (Upstash Redis) ---
  // Must be a remote Upstash REST URL, not localhost
  UPSTASH_REDIS_REST_URL: z
    .url()
    .refine(url => !url.includes('localhost') && !url.includes('127.0.0.1'), {
      message: "UPSTASH_REDIS_REST_URL must be a remote Upstash URL, not local.",
    }),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // --- CORS Configuration ---
  CORS_ORIGINS: z
    .string()
    .default('https://derlg.com,https://www.derlg.com') // Default values
    .transform((val) => val.split(',').map((origin) => origin.trim())),
});

/**
 * Inferred type from the schema for use in the ConfigService.
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validation function for @nestjs/config.
 * This function is called by NestJS on startup to validate merged environment variables.
 */
export function validate(config: Record<string, unknown>) {
  // Use the merged configuration (process.env + .env) for validation
  const result = envSchema.safeParse(config);

  if (result.success === false) {
    console.error('❌ Invalid environment variables detected in custom-env (@backend/.env):');
    
    // Flatten and format errors for better readability in logs
    const flattened = z.flattenError(result.error);
    const errors = flattened.fieldErrors;

    Object.entries(errors).forEach(([field, messages]) => {
      console.error(` - ${field}: ${messages?.join(", ")}`);
    });

    throw new Error('Environment validation failed: Remote service requirements (Supabase/Upstash) not met or missing variables.');
  }

  // Return the validated data; NestJS ConfigService will use this instead of raw process.env
  return result.data;
}
