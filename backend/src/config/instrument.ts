import * as Sentry from "@sentry/nestjs"
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { config } from "dotenv";
import { join } from "path";

// Load .env explicitly because instrument.ts runs before NestJS ConfigModule
config({ path: join(process.cwd(), '.env') });

const dsn = process.env['SENTRY_DSN'];

if (dsn) {
  Sentry.init({
    dsn,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    sendDefaultPii: true,
  });
  console.log('✅ Sentry initialized from instrument.ts');
} else {
  console.warn('⚠️ Sentry DSN not found. Sentry is disabled.');
}
