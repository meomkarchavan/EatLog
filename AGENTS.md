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
