# EatLog — Strict CI/CD Git & Development Workflow

## 1. Protected Branches
- **Never commit directly to `main` or `dev`.**
- Direct commits to `main` or `dev` are strictly forbidden.

## 2. Feature & Fix Branching
- **Always Branch Off `dev`**: All new changes, features, or bug fixes must be developed on a newly created branch created off of `dev`.
- **Naming Conventions**:
  - `feature/<feature-name>` (e.g. `feature/dynamic-targets`, `feature/barcode-scanner`)
  - `fix/<bug-name>` (e.g. `fix/auth-bug`, `fix/water-decrement`)
  - `chore/<chore-name>`

## 3. Staging (`dev` Branch)
- Feature and bugfix branches must be merged exclusively into the `dev` branch via Pull Request (PR) after all automated unit and E2E tests pass.
- Pushing/merging to `dev` automatically triggers deployment to:
  - **Firebase Staging/Dev**: `eatlog-dev`
  - **Vercel Preview Environment**

## 4. Production (`main` Branch)
- Only thoroughly tested and verified code from `dev` is allowed to be merged into `main`.
- The `main` branch strictly represents production and connects to:
  - **Firebase Production**: `eatlog-924b6`
  - **Vercel Production URL**: `https://eattlog.vercel.app`

## 5. Verification Checklist Before PR / Merge
1. Run Vitest unit tests: `npm run test` (must pass 100%).
2. Run Playwright E2E suite: `npm run test:e2e` (must pass).
3. Validate production build: `npm run build` (must be clean).
