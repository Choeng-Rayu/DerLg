import * as Sentry from '@sentry/node';
import { config } from 'dotenv';
import { join } from 'path';

// Load .env explicitly because instrument.ts runs before NestJS ConfigModule
config({ path: join(process.cwd(), '.env') });

const dsn = process.env['SENTRY_DSN'];

if (dsn) {
  Sentry.init({
    dsn,
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    sendDefaultPii: true,
  });
  console.log('✅ Sentry initialized from instrument.ts');
} else {
  console.warn('⚠️ Sentry DSN not found. Sentry is disabled.');
}
