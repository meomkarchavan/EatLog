---
version: "1.0"
source: "VoltAgent/awesome-design-md — Supabase + Vercel DESIGN.md (MIT)"
name: EatLog-Design-System
description: >
  EatLog design language — a dark nutrition-tracking dashboard.
  Structural foundation derived from Supabase's developer-centric
  dark canvas and Vercel's precise token hierarchy. Extended with
  EatLog-specific macro accent colors, monospace stat typography,
  and high-density data component rules for meal logs, HUD cards,
  and weekly charts.
---

# EatLog Design System

---

## 1. System Foundations
EatLog utilizes a data-dense, developer-grade interface optimized for strength athletes, powerlifters, and lifters who demand zero friction. The design emphasizes instant macronutrient readability, high visual contrast, and consistent data token semantics.

---

## 2. Color Palette & Roles

### Dark Mode Tokens (Standard)
The core high-contrast, data-dense dark mode visual identity extracted from the reference design.

| Token | Value | Role & Usage |
|---|---|---|
| `--bg-base` | `#000000` | Strict black page canvas background |
| `--bg-surface` | `#1A1A1A` | Cards, list items, modal panels, lookup drawers |
| `--bg-elevated` | `#222222` | Form inputs, interactive row hover states, active pill backgrounds |
| `--bg-overlay` | `rgba(255, 255, 255, 0.05)` | Glassmorphism overlays, subtle section dividers |
| `--border-subtle` | `#2A2A2A` | Card perimeters, row borders, divider lines |
| `--border-strong` | `#3D3D3D` | Focused inputs, active tab borders |
| `--color-text-primary` | `#FFFFFF` | Primary headers, numeric stat values, main body copy |
| `--color-text-secondary` | `#888888` | Metric labels, subheaders, timestamps, secondary copy |
| `--color-text-tertiary` | `#666666` | Input placeholders, disabled controls, inactive tabs |
| `--color-text-inverse` | `#000000` | High-contrast text on bright neon action buttons |
| `--color-calories` | `#FFC107` | **Calories** — Neon amber/yellow HUD cards & progress fills |
| `--color-protein` | `#00E676` | **Protein & Gain (Main Action)** — Vibrant neon green; primary buttons (*"Analyze My Data"*), protein stats |
| `--color-carbs` | `#03A9F4` | **Carbohydrates** — Electric light blue stat badges & indicators |
| `--color-fat` | `#F44336` | **Fat** — Vibrant red stat badges & gauges |
| `--color-fiber` | `#C0CA33` | **Fiber** — Neon lime green tags & metrics |
| `--color-weight` | `#E040FB` | **Body Weight** — Vivid neon magenta/purple line charts & weight trackers |
| `--color-water` | `#00E5FF` | **Hydration** — Cyan / sky blue water volume gauges & quick logs |

#### Dark Mode Glow Effects
Applied exclusively to progress bar lead edges and focused HUD highlights:
```css
--glow-protein:  0 0 12px rgba(0, 230, 118, 0.40);
--glow-calories: 0 0 12px rgba(255, 193, 7, 0.40);
--glow-carbs:    0 0 12px rgba(3, 169, 244, 0.40);
--glow-fat:      0 0 12px rgba(244, 67, 54, 0.40);
--glow-weight:   0 0 12px rgba(224, 64, 251, 0.40);
--glow-water:    0 0 12px rgba(0, 229, 255, 0.40);
```

---

### Light Mode Tokens (Complementary Palette)
A matching, complementary light mode maintaining the exact same color identity for each macro, calibrated with richer, higher-contrast tones that provide crisp legibility against white and light-gray surfaces (WCAG AA compliant).

| Token | Value | Role & Usage |
|---|---|---|
| `--bg-base` | `#FFFFFF` | Pure white page background |
| `--bg-surface` | `#F5F5F5` | Crisp light-gray card backgrounds, list items, panels |
| `--bg-elevated` | `#EBEBEB` | Elevated form inputs, table hover states, badge pills |
| `--bg-overlay` | `rgba(0, 0, 0, 0.03)` | Subtle divider overlays, modal backdrop tints |
| `--border-subtle` | `#E0E0E0` | Card borders, table dividers, input borders |
| `--border-strong` | `#BDBDBD` | Active input outlines, focused states |
| `--color-text-primary` | `#111111` | Near-black primary typography, headlines, and data values |
| `--color-text-secondary` | `#666666` | Medium gray labels, descriptions, and timestamps |
| `--color-text-tertiary` | `#888888` | Input placeholders, muted footnotes |
| `--color-text-inverse` | `#FFFFFF` | White text on solid colored buttons & badges |
| `--color-calories` | `#D97706` | **Calories** — Rich warm amber/gold stat values and gauges |
| `--color-protein` | `#00A854` | **Protein & Gain (Main Action)** — Rich emerald green; primary action buttons & targets |
| `--color-carbs` | `#0284C7` | **Carbohydrates** — Rich azure blue badges and metrics |
| `--color-fat` | `#D32F2F` | **Fat** — Deep crimson red badges and charts |
| `--color-fiber` | `#65A30D` | **Fiber** — Deep olive lime tags & metrics |
| `--color-weight` | `#9333EA` | **Body Weight** — Rich royal purple/magenta charts & weight trackers |
| `--color-water` | `#0284C7` | **Hydration** — Deep sky cyan volume trackers |

#### Light Mode Elevation & Card Shadows
```css
--shadow-card-light: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md-light:   0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
--shadow-lg-light:   0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
```

---

## 3. Typography

### Font Stack
Vercel uses **Geist** for display; Supabase uses **Circular**. EatLog uses **Inter** (universally available, neutral, high legibility at small sizes) + **JetBrains Mono** for all numerical stats.

```css
--font-sans: 'Inter', 'Geist', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Geist Mono', ui-monospace, Menlo, monospace;
```

### Scale
Aligned with Vercel's spacing rhythm and Supabase's display-tier sizes.

| Token | Size | Weight | Line-height | Letter-spacing | Font | Usage |
|-------|------|--------|-------------|----------------|------|-------|
| `--text-display` | 32px | 600 | 40px | -1.28px | sans | Page titles |
| `--text-heading` | 20px | 600 | 28px | -0.6px | sans | Card headings |
| `--text-subheading` | 16px | 500 | 24px | 0 | sans | Field group labels |
| `--text-body` | 14px | 400 | 20px | -0.28px | sans | Meal names, descriptions |
| `--text-small` | 12px | 400 | 16px | 0 | sans | Timestamps, footnotes |
| `--text-stat-xl` | 40px | 700 | 1 | -1.2px | **mono** | HUD macro totals |
| `--text-stat-lg` | 24px | 700 | 1 | -0.48px | **mono** | Chart axis labels |
| `--text-stat-md` | 16px | 600 | 1 | 0 | **mono** | Meal-row gram values |
| `--text-stat-sm` | 12px | 500 | 1 | 0 | **mono** | Progress bar labels |

> **Hard rule**: Every number representing grams, kcal, ml, or kg **must** use `--font-mono` and a `--text-stat-*` token. Mixing proportional fonts with numeric data in the same row is forbidden.

---

## 4. Spacing

Aligned with Vercel's `xxs → section` spacing scale, adapted to EatLog's 4px base.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Icon padding, tight gaps |
| `--space-2` | `8px` | Compact element spacing |
| `--space-3` | `12px` | Input internal padding |
| `--space-4` | `16px` | Card inner padding (default) |
| `--space-5` | `20px` | Section gap inside panel |
| `--space-6` | `24px` | Between cards |
| `--space-8` | `32px` | Section separators |
| `--space-12` | `48px` | Top-level page padding |
| `--space-16` | `64px` | Major section breaks |

---

## 5. Border Radius

Directly from Vercel's `rounded` scale.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `4px` | Tags, badges |
| `--radius-sm` | `6px` | Inputs, small buttons |
| `--radius-md` | `8px` | Standard buttons, inputs |
| `--radius-lg` | `12px` | Cards, panels |
| `--radius-xl` | `16px` | Modals, drawers |
| `--radius-full` | `9999px` | Progress pills, avatar |

---

## 6. Elevation / Shadow

```css
--shadow-sm:   0 1px 3px rgba(0, 0, 0, 0.5);
--shadow-md:   0 4px 12px rgba(0, 0, 0, 0.6);
--shadow-lg:   0 8px 32px rgba(0, 0, 0, 0.7);
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.04);
```

---

## 7. Visual Density

EatLog is a **data-dense dashboard**, not a landing page. Three density modes:

| Mode | Card Padding | Row Height | Chart Height | Usage |
|------|---|---|---|---|
| `compact` | `--space-3` (12px) | 40px | 180px | Meal log rows, lookup results |
| `default` | `--space-4` (16px) | 48px | 220px | HUD macro cards, profile forms |
| `relaxed` | `--space-6` (24px) | 56px | 280px | Weekly charts, settings sections |

**Default for macro cards and meal log rows: `compact`.** Never use `relaxed` on data rows.

---

## 8. Components

### Macro Progress Bar
Based on Supabase's `pill-tag-green` + Vercel's `hairline` track pattern, adapted for dark canvas.

```
Track:  background: var(--bg-elevated); height: 6px; border-radius: var(--radius-full)
Fill:   background: var(--color-<macro>); box-shadow: var(--glow-<macro>)
Label:  font: var(--font-mono); font-size: 12px; color: var(--color-text-secondary)
```

- Compact rows: track height `6px`
- HUD cards: track height `8px`
- Animate fill `width` with `transition: width 400ms cubic-bezier(0.16,1,0.3,1)` on value change

### HUD Metric Card
Based on Supabase's `card-feature-dark` token.

```
Background:  var(--bg-surface)       → Supabase canvas-night
Border:      1px solid var(--border-subtle)
Radius:      var(--radius-lg)        → Vercel rounded.lg = 12px
Shadow:      var(--shadow-card)
Accent bar:  3px solid var(--color-<macro>) — top edge only
Padding:     var(--space-4)          → compact density
```

Stat number: `--text-stat-xl`, colored with `var(--color-<macro>)`
Goal label: `--text-small`, `--color-text-secondary`

### Meal Log Row
Based on Supabase's `card-feature-dark` at compact density.

```
Background:  var(--bg-surface)
Border-bottom: 1px solid var(--border-subtle)
Height:      40px (compact)
Padding:     0 var(--space-4)
```

Macro values: inline, `--space-3` gap between each, `--font-mono`, `--text-stat-md`
Each macro value: colored with its `var(--color-<macro>)` token

### Form Input
Derived from Vercel's `form-input` component spec.

```
background:    var(--bg-elevated)     → Vercel canvas
border:        1px solid var(--border-subtle)
border-radius: var(--radius-md)       → Vercel rounded.sm (8px)
height:        40px (default), 32px (sm), 48px (lg)
padding:       0 var(--space-3)
font:          var(--font-sans), --text-body
color:         var(--color-text-primary)
```

Focus state:
```
border-color:  var(--border-strong)
box-shadow:    0 0 0 2px rgba(59,130,246,0.4)   /* carbs blue — EatLog action color */
```

### Button — Primary
Derived from Supabase's `button-primary-green` + Vercel's pill rounding.

```
background:    var(--color-protein)   /* emerald — primary action */
color:         var(--color-text-inverse)
border-radius: var(--radius-full)     /* Vercel pill style */
padding:       0 var(--space-4)
height:        36px
font:          var(--font-sans), 14px, weight 500
```

### Button — Secondary
```
background:    transparent
border:        1px solid var(--border-strong)
color:         var(--color-text-primary)
border-radius: var(--radius-full)
padding:       0 var(--space-4)
height:        36px
```

### Navigation Bar
Derived from Supabase's `nav-bar-light` at dark polarity.

```
background:    var(--bg-surface)
border-bottom: 1px solid var(--border-subtle)
height:        64px                   → Vercel nav height
padding:       0 var(--space-6)
```

### Weekly Chart
Uses Recharts (already installed). Based on Vercel's `ex-data-table-cell` token for grid styling.

```
background:  var(--bg-surface)
grid lines:  rgba(255,255,255,0.05)
axes:        var(--color-text-tertiary)
tooltip bg:  var(--bg-elevated)
tooltip shadow: var(--shadow-md)
tooltip radius: var(--radius-md)
```

Line/bar per macro: exactly `var(--color-<macro>)` — no generic colors.

### Code Block / Monospace Display
Derived from Supabase's `code-block` token.

```
background:  var(--bg-elevated)
color:       var(--color-text-primary)
font:        var(--font-mono), 13px
border-radius: var(--radius-sm)
padding:     var(--space-4)
```

---

## 9. Motion

Aligned with Vercel's interaction philosophy (purposeful, fast, no decorative animation).

| Duration | Value | Usage |
|----------|-------|-------|
| `--duration-short` | `120ms` | Hover states, color changes |
| `--duration-base` | `200ms` | Button press, focus rings |
| `--duration-enter` | `280ms` | Card mount, modal open |
| `--duration-exit` | `160ms` | Always faster than enter |

```css
--ease-enter: cubic-bezier(0.16, 1, 0.3, 1);  /* expo-out */
--ease-exit:  ease-in;
--ease-progress: cubic-bezier(0.16, 1, 0.3, 1);
```

Progress bar fill: `transition: width var(--duration-enter) var(--ease-progress)`

All transitions wrapped in:
```css
@media (prefers-reduced-motion: no-preference) { ... }
```

---

## 10. Iconography

- Library: `lucide-react` (already installed in EatLog)
- Sizes: `16px` inline, `20px` buttons, `24px` navigation
- Stroke width: `1.5` — do not override
- Color: always inherit from parent context

---

## 11. Accessibility

| Check | Requirement | Source |
|-------|-------------|--------|
| Body text contrast | ≥ 4.5:1 vs `--bg-surface` | WCAG AA |
| Large / stat text | ≥ 3:1 | WCAG AA Large |
| Macro colors | Always paired with a label — never color-only meaning | Vercel a11y |
| Focus rings | `0 0 0 2px rgba(59,130,246,0.4)` on all interactive elements | EatLog standard |
| Reduced motion | All transitions in `@media (prefers-reduced-motion: no-preference)` | WCAG 2.3 |
| Form labels | `<label>` above every input — no placeholder-as-label | Supabase forms |

---

## 12. Do / Don't

| Do | Don't |
|----|-------|
| Use `--font-mono` for all gram/kcal values | Use proportional font for nutritional numbers |
| Use Supabase's `canvas-night` (#1c1c1c) for cards | Use pure black (#000) for card surfaces |
| Use Vercel's `rounded.lg` (12px) for cards | Mix radius scales across components |
| Use `compact` density for meal rows | Pad meal rows to `relaxed` — wastes vertical space |
| Colour each macro with its dedicated token | Use generic grey for any macro value |
| Apply glow only to progress bar fill edge | Apply glow to card borders, headings, or icons |
| Use Vercel's pill (`border-radius: 9999px`) for primary buttons | Use square or low-radius buttons |
| Animate progress bar `width` on value change | Animate the raw number text |
