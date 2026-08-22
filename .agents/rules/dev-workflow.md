# Development & Deployment Workflow Rules

## 1. Development & Staging Flow
1. **Develop on `dev`**: All new features, enhancements, and fixes must be developed on `dev` (or feature branches branched from `dev`).
2. **Local Verification**:
   - Run Vitest unit & component test suite (`npm run test`) — must pass 100%.
   - Run local Playwright E2E test suite (`npm run test:e2e`) — must pass 100%.
3. **Commit & Push to `origin/dev`**:
   - Stage and commit changes to `dev`.
   - Push to `origin/dev`.
4. **Vercel Preview Deployment Verification**:
   - Wait for Vercel to build and report `● Ready` on the Preview / Dev deployment.
   - Run hosted Playwright E2E tests against the live Preview URL (`BASE_URL=<preview-url> npx playwright test`).

## 2. Strict Production / `main` Branch Rule
- **NEVER merge into `main` automatically.**
- Merging `dev` into `main` and pushing to production (`origin/main`) must **ONLY** be performed when the user explicitly instructs to merge to `main`.
- When asked to add, fix, or update something, stop after verifying on `dev` and the Vercel preview environment, and report the status to the user.
