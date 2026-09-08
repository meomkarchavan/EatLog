# Agent Guidelines for EatLog

## 1. Codebase Understanding & Architecture (Graphify)
All AI agents working on this project MUST use the Graphify knowledge graph (`graphify-out/`) as their primary source of truth when learning about the project architecture, features, and dependencies:
- **Architecture Overview**: Read `graphify-out/GRAPH_REPORT.md` before exploring or making assumptions about system structure.
- **Targeted Subgraphs**: Run `graphify query "<question>"` for scoped dependency traversal.
- **Component Flow**: Run `graphify path "<ComponentA>" "<ComponentB>"` to trace interactions.
- **Sync on Edit**: Always run `graphify update .` after adding, modifying, or deleting code files.

## 2. Strict CI/CD & Branching Rules
- **Protected Branches**: Never commit directly to `main` or `dev`.
- **Feature Branches**: Branch from `dev` (`feature/*`, `fix/*`, `chore/*`).
- **Merge Target**: Merge only into `dev` via PR after test verification.
- **Production Guard**: Never merge to `main` without explicit user instruction.

## 3. Deployments (Dev & Prod)
When instructed to deploy to Dev or Prod, follow the step-by-step instructions in [docs/DEPLOYMENT_GUIDE.md](file:///d:/code/EatLog/docs/DEPLOYMENT_GUIDE.md):
- **Dev**: Deploy Firestore rules/indexes (`npm run deploy:firestore:dev`) and push to `dev` branch for Vercel preview.
- **Prod**: Verify all tests pass, deploy Firestore rules/indexes (`npm run deploy:firestore:prod`), and merge to `main` (requires explicit user confirmation).

## 4. Mandatory Post-Deployment Live UI & Backend API Verification
After every deployment (Dev or Prod), agents MUST execute both the unmocked live backend smoke test and end-to-end UI suite against the target live URL to verify full app functionality (Live Gemini Models, Serverless Endpoints, Auth, Profile/Dynamic Targets, HUD Macros, Water, Weight, Meal Logging, Edit/Pin Staples, Quick Lookup, Weekly Charts, CSV Export):
- **Dev Live Backend & UI Check**: `npm run test:live:dev` && `npm run test:e2e:dev`
- **Prod Live Backend & UI Check**: `npm run test:live:prod` && `npm run test:e2e:prod`
- Never claim a deployment is successful without passing both live API and UI scenario verifications.


