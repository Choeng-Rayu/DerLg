# UI Context

## Theme

Light mode primary. Dark mode supported via CSS variable overrides (next-themes). The visual language is a modern travel site — clean white surfaces, bold photography, generous white space, and a forest green brand identity that evokes Cambodia's lush landscapes and ancient temples. Amber/gold accent for cultural warmth and heritage highlights.

## Design Inspiration

Reference design (from brand sample):
- Dark forest green top navigation bar with white navigation links
- Full-width hero with stunning Cambodia landmark photography (Angkor Wat, Bayon Temple)
- White content sections with clean typography
- Card grids for places with overlay labels
- Icon feature rows (AI Recommendation, Budget Planner, Assistance)
- "Why Choose Us" value proposition section

## Color System

All colors defined as CSS custom properties in `app/globals.css`. Components use these tokens exclusively — no hardcoded hex values anywhere.

### Primary Palette — Forest Green (Cambodia Landscape)

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--color-primary-50` | `#f0fdf4` | `#f0fdf4` | Very light green tint, hover backgrounds |
| `--color-primary-100` | `#dcfce7` | `#dcfce7` | Light green, feature icon backgrounds |
| `--color-primary-200` | `#bbf7d0` | `#bbf7d0` | Subtle green fills |
| `--color-primary-300` | `#86efac` | `#86efac` | Light interactive states |
| `--color-primary-400` | `#4ade80` | `#4ade80` | Hover on dark surfaces |
| `--color-primary-500` | `#22c55e` | `#22c55e` | Primary CTA buttons, links |
| `--color-primary-600` | `#16a34a` | `#16a34a` | Button hover, active states |
| `--color-primary-700` | `#15803d` | `#4ade80` | Dark button variant |
| `--color-primary-800` | `#166534` | `#86efac` | Strong green text |
| `--color-primary-900` | `#14532d` | `#bbf7d0` | Very dark green (headings on light) |
| `--color-primary-950` | `#052e16` | `#dcfce7` | Nav bar background |

### Accent — Amber/Gold (Cambodian Temple Heritage)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#d97706` | Highlight badges, festival dates, loyalty points |
| `--color-accent-light` | `#fbbf24` | Hover, icon fills |
| `--color-accent-subtle` | `#fef3c7` | Accent background chips |

### Semantic Colors

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--color-success` | `#16a34a` | `#4ade80` | Booking confirmed, success states |
| `--color-warning` | `#d97706` | `#fbbf24` | Pending states, caution |
| `--color-danger` | `#dc2626` | `#f87171` | Error states, cancel, SOS button |
| `--color-info` | `#0284c7` | `#38bdf8` | Info banners, links |

### Surface Tokens

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--color-surface-base` | `#ffffff` | `#020617` | Page background |
| `--color-surface-raised` | `#f8faf8` | `#0f172a` | Card backgrounds, panels |
| `--color-surface-muted` | `#f0f7f0` | `#162132` | Section backgrounds, inputs |
| `--color-surface-inverted` | `#052e16` | `#f8faf8` | Nav bar, dark hero overlays |

### Text Tokens

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--color-foreground` | `#0f1a0f` | `#e2e8f0` | Body text, headings |
| `--color-foreground-muted` | `#2d4a2d` | `#94a3b8` | Secondary text, descriptions |
| `--color-foreground-subtle` | `#4a7a4a` | `#64748b` | Placeholder, meta info, captions |

### Border & Shadow

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--color-border` | `#d1e8d1` | `#1e3a2e` | Card borders, dividers, inputs |
| `--shadow-sm` | `0 10px 30px rgba(5,46,22,0.06)` | `0 12px 30px rgba(2,6,23,0.35)` | Card hover |
| `--shadow-md` | `0 18px 40px rgba(5,46,22,0.10)` | `0 22px 44px rgba(2,6,23,0.42)` | Modals, dropdowns |
| `--shadow-lg` | `0 24px 60px rgba(5,46,22,0.18)` | `0 32px 64px rgba(2,6,23,0.54)` | Hero elements |

## Typography

| Role | Font | CSS Variable | Weight |
|------|------|-------------|--------|
| Primary UI | Inter | `--font-sans` | 400, 500, 600, 700 |
| Khmer script | Noto Sans Khmer | `--font-khmer` | 400, 500, 600, 700 |

**Fluid type scale (CSS clamp):**

| Token | Value | Usage |
|-------|-------|-------|
| `--fluid-h1` | `clamp(2.2rem, 1.45rem + 3vw, 4.2rem)` | Hero headlines |
| `--fluid-h2` | `clamp(1.75rem, 1.2rem + 2vw, 3rem)` | Section headings |
| `--fluid-h3` | `clamp(1.35rem, 1rem + 1vw, 2rem)` | Card headings |

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-section` | `clamp(3rem, 2rem + 3vw, 7rem)` | Vertical padding between page sections |
| `--space-page` | `clamp(1rem, 0.75rem + 1.5vw, 2rem)` | Horizontal page padding |

## Border Radius

| Token | Value | Context |
|-------|-------|---------|
| `--radius-sm` | `0.75rem` | Tags, badges, chips, small buttons |
| `--radius-md` | `1rem` | Cards, inputs, dropdowns |
| `--radius-lg` | `1.5rem` | Modals, sheets, large panels |
| `rounded-full` | (Tailwind) | Pills, avatar circles, icon buttons |

## Component Library

shadcn/ui on Tailwind CSS v4. Components installed via `npx shadcn@latest add <component>` into `components/ui/`. Never hand-write shadcn component files.

**Components to install for this project:**
- `button` — primary, secondary, outline, ghost, destructive variants
- `input`, `textarea`, `select`, `checkbox`, `radio-group` — forms
- `label` — form labels with accessibility
- `card` — content cards
- `dialog` — modal overlays
- `sheet` — bottom/side slide panels (mobile-first)
- `badge` — status chips, price tags, category labels
- `avatar` — user profile images
- `skeleton` — loading placeholders
- `toast` — notification toasts (via Sonner)
- `tabs` — page-level tab navigation
- `separator` — visual dividers
- `scroll-area` — custom scrollbars
- `dropdown-menu` — context menus, user menu
- `command` — search command palette
- `progress` — booking progress steps

## Layout Patterns

### Mobile Navigation
- **Bottom Nav** (mobile, `lg:hidden`): 5-tab bar fixed to bottom — Home, Explore, Chat, My Trip, Profile
- Icons: Lucide React, `h-6 w-6`, primary green for active tab, muted for inactive
- Active tab: icon filled-style or color highlight, label visible below icon
- Height: `h-16` (4rem), `pb-safe` for iPhone notch

### Top Bar (desktop `lg:flex`, mobile visible)
- Logo left: "derlg.com" in brand green on dark green background
- Nav links center: Destinations, AI Features, About, Contact (white text on dark nav)
- Right: Language switcher, dark mode toggle, Sign In / avatar menu
- Background: `var(--color-surface-inverted)` (dark forest green `#052e16`)

### Hero Section
- Full-viewport-width image behind text
- Dark gradient overlay (bottom-to-top) for text readability
- White headline using `--fluid-h1`
- Two CTA buttons: primary (white background, dark green text) + secondary (outline, white)

### Content Sections
- `py-[var(--space-section)]` vertical spacing
- `px-[var(--space-page)]` horizontal padding
- Max-width container: `max-w-7xl mx-auto`

### Cards
- Rounded `--radius-md` (1rem)
- `var(--color-surface-raised)` background
- Border: `1px solid var(--color-border)`
- Hover: `var(--shadow-sm)` elevation + slight scale `hover:scale-[1.02]`
- Image top, content bottom with padding

### Floating Elements
- **AIChat button**: Fixed bottom-right, above BottomNav — `bottom-20 right-4` on mobile, `bottom-6 right-6` on desktop
- **Emergency SOS**: Fixed bottom-left — `bottom-20 left-4` on mobile — red `var(--color-danger)`, always visible
- Both must not overlap each other or obscure critical content

### Modals & Sheets
- Mobile: Bottom Sheet (`sheet` from shadcn, slide up from bottom)
- Desktop: Centered Dialog (`dialog` from shadcn)
- Backdrop: `bg-black/50 backdrop-blur-sm`
- Rounded top corners only on mobile sheets: `rounded-t-[--radius-lg]`

## Icons

Lucide React. Stroke-based only — no filled icons except for active nav states.

| Size | Usage |
|------|-------|
| `h-4 w-4` | Inline text icons, button icons |
| `h-5 w-5` | Navigation, form icons |
| `h-6 w-6` | Bottom nav icons |
| `h-8 w-8` | Feature section icons |
| `h-10 w-10` | Empty state illustrations |

Stroke width: `1.5` (Lucide default).

## Image Treatment

- Cambodia landmark photos: always full-width, object-cover
- `next/image` with `priority` on hero and above-fold images
- Overlay gradient for text on images: `bg-gradient-to-t from-black/70 via-black/20 to-transparent`
- Aspect ratios: Hero `aspect-[16/9]` or `aspect-[21/9]`, cards `aspect-[4/3]`, avatars `aspect-square`
- Always use `alt` text for accessibility

## Responsive Breakpoints

Tailwind defaults (mobile-first):
- Default (≥320px) — mobile, BottomNav visible
- `md` (≥768px) — tablet, grid columns expand
- `lg` (≥1024px) — desktop, TopBar full, BottomNav hidden, sidebar layouts

## Accessibility

- Color contrast: minimum WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Focus rings: `outline-2 outline-primary-500 outline-offset-2` on all interactive elements
- Touch targets: minimum 44×44px
- Skip to content link: `.skip-link` (already in `app/layout.tsx`)
- Semantic HTML: `<nav>`, `<main id="content">`, `<section>`, `<article>`, `<aside>`
