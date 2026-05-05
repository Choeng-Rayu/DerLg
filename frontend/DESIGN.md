---
name: DerLg
colors:
  primary-50: "#f0fdf4"
  primary-100: "#dcfce7"
  primary-200: "#bbf7d0"
  primary-300: "#86efac"
  primary-400: "#4ade80"
  primary-500: "#22c55e"
  primary-600: "#16a34a"
  primary-700: "#15803d"
  primary-800: "#166534"
  primary-900: "#14532d"
  primary-950: "#052e16"
  dark-primary-700: "#4ade80"
  dark-primary-800: "#86efac"
  dark-primary-900: "#bbf7d0"
  dark-primary-950: "#dcfce7"
  accent: "#f59e0b"
  success: "#059669"
  warning: "#d97706"
  danger: "#dc2626"
  surface-base: "#f8fafc"
  surface-raised: "#ffffff"
  surface-muted: "#edf2f7"
  surface-inverted: "#0f172a"
  foreground: "#0f172a"
  foreground-muted: "#334155"
  foreground-subtle: "#64748b"
  border: "#dbe4ee"
  dark-surface-base: "#020617"
  dark-surface-raised: "#0f172a"
  dark-surface-muted: "#162132"
  dark-surface-inverted: "#f8fafc"
  dark-foreground: "#e2e8f0"
  dark-foreground-muted: "#cbd5e1"
  dark-foreground-subtle: "#94a3b8"
  dark-border: "#243244"
typography:
  fontFamily: "var(--font-sans), system-ui, sans-serif"
  fluid-h1: "clamp(2.2rem, 1.45rem + 3vw, 4.2rem)"
  fluid-h2: "clamp(1.75rem, 1.2rem + 2vw, 3rem)"
  fluid-h3: "clamp(1.35rem, 1rem + 1vw, 2rem)"
rounded:
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
shadows:
  sm: "0 10px 30px rgba(15, 23, 42, 0.06)"
  md: "0 18px 40px rgba(15, 23, 42, 0.1)"
  lg: "0 24px 60px rgba(15, 23, 42, 0.18)"
  dark-sm: "0 12px 30px rgba(2, 6, 23, 0.35)"
  dark-md: "0 22px 44px rgba(2, 6, 23, 0.42)"
  dark-lg: "0 32px 64px rgba(2, 6, 23, 0.54)"
spacing:
  section: "clamp(3rem, 2rem + 3vw, 7rem)"
  page: "clamp(1rem, 0.75rem + 1.5vw, 2rem)"
---

## Brand & Style

**DerLg** is a comprehensive Cambodian travel booking platform designed primarily with a **mobile-first** approach. The design system emphasizes clarity, approachability, and ease of use for travelers booking trips, hotels, and transportation. 

The aesthetic is clean and modern, leveraging a vibrant green primary palette that evokes a sense of freshness, nature, and sustainability—perfectly aligned with exploring the lush landscapes of Cambodia. Ample white space and fluid typography are utilized to ensure the interface feels uncluttered and adapts perfectly from small mobile screens to larger desktop displays. The inclusion of a robust dark mode maintains legibility and visual comfort in low-light environments.

## Colors

The color palette is built around a versatile set of primary greens, semantic status colors, and neutral surface and foreground tones.

- **Primary Palette:** A full spectrum of greens ranging from very light tints (`primary-50` to `primary-300`) for hover states and backgrounds, to deep, grounded shades (`primary-700` to `primary-950`) for headings and navigation. The core brand color is `primary-500` (#22c55e).
- **Dark Mode Primary:** In dark mode, the primary scale is adjusted for high contrast, utilizing lighter greens (`#4ade80` to `#dcfce7`) for headings and critical UI elements against dark backgrounds.
- **Semantic Accents:** Warm amber (`accent`), green (`success`), orange (`warning`), and red (`danger`) provide clear contextual feedback. Note that the primary green scale overlaps with the traditional success color, reinforcing a positive, "go"-oriented user experience.
- **Surfaces & Contrast:** Light mode utilizes off-white backgrounds (`#f8fafc`) with stark white elevated surfaces (`#ffffff`). Dark mode shifts to deep navy/slate backgrounds (`#020617` and `#0f172a`).
- **Borders & Dividers:** Subtle borders (`#dbe4ee` in light, `#243244` in dark) separate content areas without creating visual noise.

## Typography

Typography in DerLg is highly responsive, utilizing CSS `clamp()` functions to smoothly scale heading sizes based on the viewport width.

- **Fluid Hierarchy:** Headings scale gracefully to maximize impact on desktop while preventing text overflow on narrow mobile screens.
  - `H1` scales between 2.2rem and 4.2rem.
  - `H2` scales between 1.75rem and 3rem.
  - `H3` scales between 1.35rem and 2rem.
- **Font Stack:** The system relies on a primary sans-serif font defined by `--font-sans`, falling back to `system-ui` and standard sans-serif, ensuring native-feeling text rendering across all platforms and languages (English, Khmer, Chinese).

## Layout & Spacing

A mobile-first mindset governs the layout rules, prioritizing vertical rhythm and sensible padding that feels right on touch devices.

- **Fluid Spacing:** Similar to typography, critical spacing uses `clamp()` to adapt contextually.
  - `section` ensures breathing room between distinct content blocks.
  - `page` provides consistent outer margins for the main viewport.
- **Focus states:** Accessibility is built-in with a prominent 2px solid `primary-500` outline on focusable elements (buttons, inputs, links), with a 2px offset.

## Elevation & Depth

Depth is established through a sequence of refined, large-spread drop shadows that give floating elements (like modals, dropdowns, and floating action buttons) a sense of distinct layering.

- **Soft Shadows:** Shadows have a large blur radius (`30px` to `60px`) and low opacity (`0.06` to `0.18` in light mode), creating a premium, soft elevation rather than harsh, distinct borders.
- **Dark Mode Elevation:** In dark mode, shadows are adjusted with higher opacity (`0.35` to `0.54`) and darker shadow colors to ensure they remain visible against the low-luminance backgrounds.

## Shapes

The interface employs generous border radii to soften the overall appearance, making the platform feel friendly and modern.

- **Radii:** Elements use a scale of `0.75rem` (sm), `1rem` (md), and `1.5rem` (lg), avoiding sharp corners on cards, buttons, and input fields.
