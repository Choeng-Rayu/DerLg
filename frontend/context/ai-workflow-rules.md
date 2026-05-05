# AI Workflow Rules

## Approach

Build this redesign incrementally using context-driven workflow. The context files in this folder define what to build, how it should look, and the current state of progress. Always implement against these specs. Do not invent design decisions or change functionality not defined here.

The redesign mission is: **visual design only** — colors, spacing, typography, layout, component library. Business logic, data fetching, API calls, and auth remain untouched.

## Scoping Rules

- Work on one component or page at a time
- Prefer small, verifiable increments over large changes across many files
- Never combine layout changes with data-fetching changes in the same step
- Never change a hook, store, or lib file unless explicitly asked — they are out of scope

## Phase Order

Follow the priority order defined in `file_description-frontend-agent.md`:

**Phase 1 — Foundation** (must complete before any page work)
1. Update `app/globals.css` — forest green token system
2. Install shadcn/ui base components (`button`, `input`, `card`, etc.)
3. Redesign `components/layout/TopBar.tsx`
4. Redesign `components/layout/BottomNav.tsx`
5. Update `app/(main)/layout.tsx` shell

**Phase 2 — Core Pages**
6. Home page + home components (HeroSection, CategoriesSection, FeaturedTrips, FestivalsSection)
7. Auth pages (login, register)
8. Explore page + explore components

**Phase 3 — Booking Flow**
9. Booking components (cards, forms, payment, confirmation)
10. Booking pages

**Phase 4 — Chat & Features**
11. Chat components (AIChat, ChatWindow, MessageBubble, inline cards)
12. Profile and My Trip pages
13. Emergency components (SOS button, contacts sheet)

**Phase 5 — Secondary Pages**
14. Guide, Hotel, Transport listings
15. Festival, Contact, Legal pages
16. Admin dashboard

## When to Split Work

Split a step if it touches:
- Multiple unrelated page domains at once
- Both a context file update and a component change
- Any logic file alongside a UI file

If you can't verify the change compiles and renders correctly in isolation, split it.

## Stitch MCP Design Workflow

When using Stitch MCP to design a page or component:

1. Open `context/ui-context.md` — reference color tokens, spacing, typography, component patterns
2. Open `context/file_description-frontend-agent.md` — find the exact component file to design
3. Open `context/project-overview.md` — understand the user flow and feature purpose
4. Design in Stitch following the visual direction from the brand sample (forest green nav, white surfaces, Cambodia photography)
5. Export the design mapped to the component's existing file structure
6. Do not redesign a component's data props or event handlers — only the JSX/className output

## Handling Missing Requirements

- Do not invent UI patterns not described in `ui-context.md`
- If a design decision is ambiguous, ask before implementing
- If a new component pattern is needed, add it to `ui-context.md` first, then implement
- Add open questions to `progress-tracker.md` before continuing

## Protected Files

Do not modify without explicit instruction:

- `hooks/**` — business logic hooks
- `stores/**` — Zustand state stores
- `lib/**` — utilities and API client
- `context/**` (source code context providers, not this docs folder)
- `providers/**` — provider wrappers
- `types/**` — shared types
- `messages/**` — i18n translation files
- `components/ui/**` — shadcn primitives (use CLI to add, never hand-edit)
- Any `*.test.ts`, `*.spec.ts` files

## Keeping Docs in Sync

After completing each phase unit:
- Update `progress-tracker.md` with what was completed
- If you discover a new design pattern or constraint, update `ui-context.md`
- If a component changes its responsibility, update `file_description-frontend-agent.md`

## Before Moving to the Next Unit

1. The component/page renders visually correctly against the design system
2. No hardcoded color values introduced (all tokens from `globals.css`)
3. No TypeScript errors (`npm run build` or `tsc --noEmit` passes)
4. `progress-tracker.md` updated with completed work
5. No business logic was altered — verify by checking that hooks/stores/lib files are unchanged
