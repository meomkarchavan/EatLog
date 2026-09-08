# Web Design Guidelines for EatLog

> Source: Vercel Web Interface Guidelines (vercel-labs/agent-skills)
> Adapted for EatLog's data-dense dark-mode nutrition dashboard.

---

## 1. Layout & Spacing

### Grid System
- Use CSS Grid as the primary layout mechanism. Flexbox for alignment within cells.
- Never use `calc()`-based percentage math for column widths — use `grid-template-columns` instead.
- Page containers: `max-width: 1400px; margin: 0 auto; padding: 0 var(--space-6)`.
- Responsive breakpoints: `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`.

### Spacing Discipline
- Use the 4px base scale defined in DESIGN.md (`--space-1` through `--space-12`).
- All spacing between components must use a defined token — no arbitrary `px` values in component code.
- Section separators: `--space-8` (32px).
- Card inner padding: `--space-4` (16px) default, `--space-3` (12px) compact.

### Viewport Stability
- Never use `height: 100vh` for full-height sections. Use `min-height: 100dvh` to prevent iOS Safari address-bar jumps.
- Sticky/fixed elements must account for safe-area insets on mobile.

---

## 2. Alignment

### Text Alignment
- Body text: always left-aligned. Never justify.
- Numeric stats: right-align within their column to allow visual scanning of digits.
- Labels above their associated inputs — never placeholder-as-label.
- Error text below the input, helper text below the label.

### Form Alignment
- Label → Input → Helper Text → Error Text (vertical stack, `gap: var(--space-2)`).
- Form groups separated by `var(--space-5)`.
- Submit buttons: full-width on mobile, auto-width right-aligned on desktop.
- Quick Lookup inputs: full-width, centered in their container panel.

### Icon Alignment
- Icons must be vertically centered with their companion text using `display: flex; align-items: center; gap: var(--space-2)`.
- Never use `vertical-align: middle` on icons inside flex containers.

---

## 3. Accessibility

### Contrast
- Body text: minimum 4.5:1 contrast ratio against its background.
- Large text / stat numbers (18px+ or 14px+ bold): minimum 3:1.
- All EatLog macro colors (`--color-protein`, `--color-carbs`, etc.) pass 3:1 minimum against `--bg-surface`. Verify before use against other backgrounds.

### Focus Management
- Every interactive element must have a visible focus indicator.
- Standard focus ring: `outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.4)` (carbs blue).
- Never remove focus styles without providing a custom visible replacement.
- Tab order must follow visual reading order.

### Motion
- Wrap all transitions and animations in `@media (prefers-reduced-motion: no-preference)`.
- Provide static fallbacks for all animated components.

### Semantic HTML
- Use `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<aside>`, `<footer>` appropriately.
- Form inputs must have associated `<label>` elements (not just `aria-label`).
- Buttons must have descriptive text or `aria-label`. No icon-only buttons without labels.
- Data tables must use `<th scope="col/row">` for headers.

---

## 4. Component Structure & Patterns

### Quick Lookup Inputs
- Container: full-width panel with `--bg-surface` background.
- Input: `--bg-elevated`, `--border-subtle` border, `--radius-md` corners.
- Focus state: border transitions to `--border-strong`, focus ring appears.
- Search results dropdown: `--bg-elevated`, `--shadow-md`, max-height 320px with scroll.
- No placeholder-as-label. Use a visible `<label>` above the input.
- Debounce search: 300ms minimum.

### Settings & Profile Forms
- Group related fields under labeled `<fieldset>` with `<legend>`.
- Inline validation: show error state on blur, not on every keystroke.
- Destructive actions (delete, reset) must require confirmation — a second click or a modal.
- Form sections separated by a `1px solid var(--border-subtle)` divider.

### Data Displays (Macro Cards, Meal Rows, Charts)
- Follow the component patterns defined in DESIGN.md §7.
- All numeric values use `--font-mono` — no exceptions.
- Charts must have a visible loading state (skeleton matching chart dimensions) and an empty state.

---

## 5. Performance & Quality Checks

### Before Shipping Any Component
- [ ] All text contrast ratios verified (4.5:1 body, 3:1 large)
- [ ] All interactive elements have `:hover`, `:focus`, `:active` states
- [ ] All numeric values use `--font-mono`
- [ ] All form inputs have associated `<label>` elements
- [ ] No hardcoded pixel values — spacing tokens used throughout
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Responsive behavior declared for `< 768px`
- [ ] `prefers-reduced-motion` respected for all animations

### Navigation
- Navigation must render on a single line on desktop (≥ 1024px).
- On mobile (< 768px), navigation collapses to a hamburger or bottom bar.

### Images & Icons
- All `<img>` elements must have descriptive `alt` attributes.
- Icons that are decorative must have `aria-hidden="true"`.
- Icons that convey meaning must have `aria-label` or be accompanied by visible text.
