# DerLg Frontend

Next.js App Router frontend for the DerLg Cambodia travel platform.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Zustand
- React Query
- React Hook Form + Zod
- next-intl

## Local Development

1. Copy env values:

```bash
cp .env.example .env.local
```

2. Start the app:

```bash
npm install
npm run dev
```

3. Open `http://localhost:3000`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:e2e
```

## Required Environment Variables

See [.env.example](./.env.example).

Key values:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_SENTRY_DSN`

## Deployment Notes

### Vercel

1. Set all `NEXT_PUBLIC_*` variables in the Vercel project.
2. Set the production app URL and API URL.
3. Run `npm run build` as the build command.
4. Serve with the default Next.js output.

### Netlify

1. Set all `NEXT_PUBLIC_*` variables in the Netlify site settings.
2. Build command: `npm run build`
3. Publish directory: `.next`

## Backend Alignment

The frontend is currently aligned to these backend route groups:

- `/v1/auth`
- `/v1/users`
- `/v1/trips`
- `/v1/explore`
- `/v1/festivals`
- `/v1/bookings`
- `/v1/payments`
- `/v1/hotels`
- `/v1/transportation`
- `/v1/guides`
- `/v1/loyalty`
- `/v1/student-discount`
- `/v1/emergency`
- `/v1/notifications`
- `/v1/currency`

## Current Notes

- The booking, profile, trip discovery, and payment intent flows are wired to the current Nest backend.
- Some advanced surfaces from the full spec are scaffolded and ready for the next implementation pass rather than fully completed end to end.
