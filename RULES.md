# EatLog UI Rules

> This file is the **single source of truth** for all UI generation in this project.
> Every agent, every session, every component must comply with all three design layers simultaneously.

---

## Mandatory Three-Layer Rule

When generating, modifying, or reviewing **any** UI component in EatLog — including but not limited to:
- Macro tracking cards (HUD, protein/carbs/fat/fiber/calories)
- Meal log rows and meal entry forms
- Historical data charts (weekly, daily trends)
- Profile goal forms and settings panels
- Quick Lookup inputs and result cards
- Auth screens

**All three of the following must be applied concurrently. Skipping any one layer is a failure:**

### Layer 1 — Layout Variance (Taste Skill)
Read and apply `.agents/skills/design-taste-frontend/SKILL.md`.

**EatLog dial settings:**
- `DESIGN_VARIANCE: 8` — no cookie-cutter symmetric layouts
- `MOTION_INTENSITY: 6` — purposeful, non-decorative motion only
- `VISUAL_DENSITY: 7` — data-dense by default; never reduce below 6

**Key enforcement points:**
- Declare a "Design Read" before generating any new page or major component
- No AI-purple gradients, no generic glassmorphism, no centered-hero-over-dark-mesh defaults
- Macro cards and meal rows must use `compact` density
- Loading states must be skeletal (matching final layout shape), never generic spinners

---

### Layer 2 — Structural Best Practices (Web Design Guidelines)
Read and apply `WEB_DESIGN_GUIDELINES.md`.

**Key enforcement points:**
- All spacing must use tokens from DESIGN.md (`--space-1` through `--space-12`)
- All form fields: label above → input → helper → error (vertical stack)
- Quick Lookup inputs must have a visible `<label>`, not placeholder-as-label
- Every interactive element must have `:hover`, `:focus`, `:active` states
- Navigation single-line on desktop, collapsed on mobile
- Verify WCAG AA contrast before shipping any component (4.5:1 body, 3:1 large)
- Wrap all animations in `@media (prefers-reduced-motion: no-preference)`

---

### Layer 3 — Color & Typography Tokens (Design System)
Read and apply `DESIGN.md`.

**Key enforcement points:**
- Page background: `--bg-base` (#0a0a0f). Cards: `--bg-surface`. Inputs: `--bg-elevated`.
- Macro accent colors are **fixed and mandatory**:
  - Protein → `--color-protein` (#22c55e)
  - Carbohydrates → `--color-carbs` (#3b82f6)
  - Fat → `--color-fat` (#f97316)
  - Fiber → `--color-fiber` (#a78bfa)
  - Calories → `--color-calories` (#facc15)
- **All nutritional numbers (grams, kcal, ml, kg) must use `--font-mono` (JetBrains Mono)**. This is non-negotiable.
- UI labels and text use `--font-sans` (Inter).
- Never mix font families in the same data row.
- Card borders: `1px solid var(--border-subtle)`. Focused inputs: `var(--border-strong)`.
- Shadow on cards: `var(--shadow-card)`.
- Macro accent top-border on HUD cards: `3px solid var(--color-<macro>)`.

---

## Pre-Ship Checklist

Before declaring any UI work complete, verify all of the following:

**Taste Skill (Layer 1)**
- [ ] Design Read declared
- [ ] VISUAL_DENSITY >= 6 for data components
- [ ] No generic spinner — skeleton loader implemented
- [ ] No AI-purple gradients or generic glassmorphism

**Web Design Guidelines (Layer 2)**
- [ ] All spacing uses design tokens
- [ ] All form fields have visible labels above inputs
- [ ] `:hover`, `:focus`, `:active` states on all interactive elements
- [ ] WCAG AA contrast verified
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive behavior declared for < 768px

**Design System (Layer 3)**
- [ ] All macro values use correct color tokens
- [ ] All nutritional numbers use `--font-mono`
- [ ] Background hierarchy correct (base → surface → elevated)
- [ ] Card shadow uses `--shadow-card`
- [ ] HUD macro cards have accent top-border

---

## Stack Constraints

| Concern | Solution |
|---------|----------|
| Framework | React + Vite (do not change) |
| Styling | Vanilla CSS + DESIGN.md custom properties |
| Charts | `recharts` (already installed) |
| Icons | `lucide-react` (already installed) |
| Backend | Firebase (Firestore + Auth) |
| Fonts | Inter + JetBrains Mono via Google Fonts |

Do not introduce Tailwind, external CSS frameworks, or new animation libraries without explicit user instruction.

---

## Branch & Deployment Rules

All UI changes follow the branching rules in `AGENTS.md`:
- Branch from `dev` using `feature/*` or `fix/*` naming
- Never commit directly to `main` or `dev`
- After deployment, run `npm run test:e2e:dev` or `npm run test:e2e:prod` to verify
