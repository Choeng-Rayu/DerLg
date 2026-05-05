# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Phase 0 — Context Setup (Complete) → **Phase 1 — Foundation (Not Started)**

## Current Goal

Install shadcn/ui and update `app/globals.css` with the forest green design token system.

## Completed

- Context files created and filled:
  - `frontend/agent.md` — Frontend agent entry point
  - `context/file_description-frontend-agent.md` — Complete file inventory and redesign priority map
  - `context/project-overview.md` — Project purpose, user flows, feature list, success criteria
  - `context/architecture.md` — Tech stack, folder boundaries, auth model, invariants
  - `context/ui-context.md` — Forest green design system, color tokens, typography, layout patterns
  - `context/code-standards.md` — TypeScript, Next.js, shadcn, i18n, import conventions
  - `context/ai-workflow-rules.md` — Phase order, Stitch MCP workflow, protected files
  - `context/progress-tracker.md` — This file

## In Progress

- None yet.

## Next Up

1. **Update `app/globals.css`** — Replace current teal token system with forest green palette defined in `ui-context.md`
2. **Install shadcn/ui** — Run `npx shadcn@latest init` and install base components (button, input, card, dialog, sheet, badge, avatar, skeleton, tabs, toast, separator, scroll-area, dropdown-menu, progress)
3. **Redesign `components/layout/TopBar.tsx`** — Dark forest green nav, logo, links, auth button
4. **Redesign `components/layout/BottomNav.tsx`** — 5-tab mobile nav with active state styling

## Open Questions

- Dark mode: Is it required for the production launch or optional post-launch?
- PWA manifest: Update `theme_color` and `background_color` to forest green (#052e16)?
- Image assets: Are Cambodia landmark photos available in the backend CDN, or should placeholders be used during redesign?
- Google Fonts: Inter + Noto Sans Khmer are already configured — confirm no additional typeface is needed
- shadcn/ui theming: Use shadcn's built-in CSS variable system alongside the existing custom tokens, or replace with pure shadcn theme?

## Architecture Decisions

- **Forest green replaces teal** — Primary brand color shifts from `#0e7490` (cyan-700) to `#16a34a` (green-600) / `#052e16` (dark nav). Reason: brand alignment per design sample provided.
- **shadcn/ui as component base** — `components/ui/` is empty; shadcn components installed via CLI are the primitive layer. Feature components in `components/<domain>/` compose these primitives.
- **Light mode primary** — Design inspiration shows light mode. Dark mode supported via existing CSS variable structure but not the primary deliverable.

## Session Notes

- Design inspiration: forest green nav (#052e16 dark, #16a34a CTA), white content areas, Cambodia landmark photography, card grids, icon feature rows
- The existing `app/globals.css` has complete teal token system — it needs to be replaced in-place with the forest green system defined in `ui-context.md`
- `components/ui/.gitkeep` is the only file in the UI primitives folder — safe to proceed with shadcn init
- All hooks, stores, lib files must remain untouched throughout the redesign
