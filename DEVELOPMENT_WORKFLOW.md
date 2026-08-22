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

## 4. Production (`main` Branch) — Explicit Approval Required
- **NEVER merge into `main` automatically.**
- Merging `dev` into `main` and deploying to production must **ONLY** be executed when the user explicitly instructs to merge to `main`.
- When asked to add/update features, complete all work and verifications on `dev` and the Vercel preview deployment, then report results and wait for explicit user permission before touching `main`.

## 5. Verification Pipeline (Step-by-Step)
1. Develop on `dev` (or branch off `dev`).
2. Run local unit tests: `npm run test` (must pass 100%).
3. Run local E2E tests: `npm run test:e2e` (must pass 100%).
4. Commit and push to `origin/dev`.
5. Wait for Vercel preview deployment to build (`● Ready`).
6. Run E2E tests against the live preview URL (`BASE_URL=<preview-url> npx playwright test`).
7. **STOP & Report to User**: Wait for explicit user confirmation before merging to `main`.

