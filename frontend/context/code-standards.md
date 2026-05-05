# Code Standards

## General

- Keep components small and single-purpose — if a component renders more than ~150 lines, split it
- Fix root causes; do not layer workarounds or add defensive code for impossible states
- Do not mix unrelated concerns in one component (data fetching + presentation + form state = too much)
- No comments that describe what the code does — name things clearly instead
- No feature flags or backwards-compatibility shims — just change the code

## TypeScript

- Strict mode is required throughout — `tsconfig.json` has `"strict": true`
- Avoid `any` — use explicit interfaces, `unknown` with narrowing, or `z.infer<typeof schema>` from Zod
- Validate unknown external data (API responses, URL params, form input) at system boundaries before trusting it
- Use `satisfies` when you want type inference but also want to enforce a shape
- Props interfaces: name them `<ComponentName>Props`, place them directly above the component

## Next.js

- Default to **Server Components** — they are the default in App Router
- Add `'use client'` only when browser APIs, event handlers, hooks (useState, useEffect, etc.) or React context are needed
- Page files (`page.tsx`) are thin — they compose components and pass data; no business logic
- Layout files (`layout.tsx`) manage structural chrome only — nav, containers, providers
- API routes in `app/api/` validate and parse input before any logic runs

## Styling

- Use CSS custom property tokens exclusively — no hardcoded hex, rgb, or hsl values in components
- Reference tokens via Tailwind's arbitrary value syntax: `bg-[var(--color-primary-500)]`
- Or via inline style when necessary: `style={{ color: 'var(--color-foreground)' }}`
- Combine classes with `cn()` from `lib/utils.ts` (clsx + tailwind-merge) — never concatenate class strings manually
- Use `cva()` from class-variance-authority for components with multiple variants
- Follow the border radius scale in `ui-context.md` — `--radius-sm / md / lg` only
- Never use `!important` — rework the specificity instead

## Component Conventions

- File names: `PascalCase.tsx` for components, `camelCase.ts` for hooks and utils
- One component per file
- Export as named export, not default, for everything except page and layout files
- Page and layout files use default export (Next.js requirement)
- Server components: no `.tsx` extension needed for the `'use client'` directive — but keep it for consistency
- Co-locate types with the file that uses them unless shared across multiple files
- Shared types live in `types/`

## shadcn/ui

- Install components via CLI: `npx shadcn@latest add <component>` — never hand-write files in `components/ui/`
- Do not modify files in `components/ui/` unless the modification is project-wide and intentional — they are regenerated on updates
- Compose shadcn primitives inside feature components — feature components live in `components/<domain>/`
- Use the `cn()` utility from `lib/utils.ts` for className merging in all shadcn usage

## Forms

- All forms use React Hook Form with a Zod schema via `@hookform/resolvers/zod`
- Never access `event.target.value` directly — always use RHF's `register` or `Controller`
- Validation errors display below each field using the field's `error` state
- Submit buttons are disabled while `isSubmitting` is true

## API Calls

- All HTTP calls go through the Axios instance in `lib/api.ts` — never import Axios directly
- Components never call the API directly — always through React Query hooks in `hooks/`
- Mutations use `useMutation` with `onSuccess` / `onError` — never `async/await` directly in a component event handler
- React Query keys: `['resource', id]` format — e.g. `['trips', tripId]`

## File Organization

- `app/` — Pages (thin), layouts, API routes only
- `components/<domain>/` — Feature components (BookingCard, HeroSection, etc.)
- `components/ui/` — shadcn/ui primitives only, installed via CLI
- `components/layout/` — Global shell components (TopBar, BottomNav, PageContainer)
- `hooks/` — Custom React hooks (data fetching, browser APIs, derived state)
- `stores/` — Zustand stores (auth, UI state, chat)
- `lib/` — Pure utilities (api instance, formatters, cn helper)
- `types/` — Shared TypeScript types and interfaces
- `messages/` — i18n JSON files (en.json, kh.json, zh.json)
- `context/` (this folder) — Agent documentation only, not source code

## Internationalization

- All user-facing strings go through `next-intl` — never hardcode English strings in components
- Use `useTranslations('Namespace')` hook in client components
- Use `getTranslations('Namespace')` in server components and page files
- Add new keys to `messages/en.json` first, then mirror to `kh.json` and `zh.json`

## Imports

- Use `@/` alias for all imports from the project root (configured in `tsconfig.json`)
- Example: `import { Button } from '@/components/ui/button'`
- Group imports: 1) React/Next 2) Third-party 3) Internal (`@/`) — separated by blank lines
