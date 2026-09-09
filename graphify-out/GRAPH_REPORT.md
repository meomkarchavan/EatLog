# Graph Report - EatLog  (2026-09-09)

## Corpus Check
- 68 files · ~42,771 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 588 nodes · 724 edges · 56 communities (53 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4d3cdf0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 148|Community 148]]
- [[_COMMUNITY_Community 167|Community 167]]
- [[_COMMUNITY_Community 168|Community 168]]
- [[_COMMUNITY_Community 169|Community 169]]
- [[_COMMUNITY_Community 172|Community 172]]
- [[_COMMUNITY_Community 173|Community 173]]
- [[_COMMUNITY_Community 174|Community 174]]
- [[_COMMUNITY_Community 180|Community 180]]
- [[_COMMUNITY_Community 183|Community 183]]
- [[_COMMUNITY_Community 184|Community 184]]
- [[_COMMUNITY_Community 186|Community 186]]
- [[_COMMUNITY_Community 189|Community 189]]
- [[_COMMUNITY_Community 190|Community 190]]
- [[_COMMUNITY_Community 192|Community 192]]
- [[_COMMUNITY_Community 193|Community 193]]
- [[_COMMUNITY_Community 196|Community 196]]
- [[_COMMUNITY_Community 198|Community 198]]
- [[_COMMUNITY_Community 199|Community 199]]
- [[_COMMUNITY_Community 200|Community 200]]
- [[_COMMUNITY_Community 201|Community 201]]
- [[_COMMUNITY_Community 205|Community 205]]
- [[_COMMUNITY_Community 207|Community 207]]
- [[_COMMUNITY_Community 211|Community 211]]

## God Nodes (most connected - your core abstractions)
1. `skills` - 26 edges
2. `scripts` - 20 edges
3. `useToast()` - 17 edges
4. `db` - 13 edges
5. `EatLog Design System` - 13 edges
6. `auth` - 12 edges
7. `8. Components` - 10 edges
8. `calculateNutritionTargets()` - 9 edges
9. `EatLog Full-Stack Deployment Guide & Runbook` - 9 edges
10. `getApiKey()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `TestConsumer()` --calls--> `useToast()`  [EXTRACTED]
  tests/unit/Toast.test.jsx → src/components/Toast.jsx
- `subscribeLookupHistory()` --calls--> `onUpdate`  [INFERRED]
  src/services/lookupHistory.js → tests/unit/lookupHistory.test.js
- `testDirectGeminiCandidates()` --calls--> `getApiKey()`  [EXTRACTED]
  scripts/test-live-api.js → api/_geminiUtils.js
- `Dashboard()` --calls--> `useToast()`  [EXTRACTED]
  src/components/Dashboard.jsx → src/components/Toast.jsx
- `LookupPanel()` --calls--> `useToast()`  [EXTRACTED]
  src/components/LookupPanel.jsx → src/components/Toast.jsx

## Import Cycles
- None detected.

## Communities (56 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (11): MealCard(), defaultContext, ToastContext, ToastProvider(), useToast(), cancelBtn, deleteBtn, dismissBtn (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (34): dependencies, firebase, @google/generative-ai, lucide-react, react, react-activity-calendar, react-dom, recharts (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, firebase-tools, jsdom, @playwright/test, postcss, tailwindcss, @testing-library/dom (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (20): 8. Components, Button — Primary, Button — Secondary, Code Block / Monospace Display, Form Input, HUD Metric Card, Macro Progress Bar, Meal Log Row (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (4): Dashboard(), formatLocalDate(), Profile(), calculateNutritionTargets()

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (8): LookupCard(), addBtn, { container }, dismissBtn, mockAdd, mockData, mockDismiss, user

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (4): WeightTracker(), input, saveBtn, user

### Community 8 - "Community 8"
Cohesion: 0.40
Nodes (3): WaterTracker(), button, user

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (4): profile, result, ACTIVITY_MULTIPLIERS, GOAL_ADJUSTMENTS

### Community 10 - "Community 10"
Cohesion: 0.25
Nodes (8): computedHash, source, sourceType, computedHash, skillPath, source, extension-to-functions-codebase, firebase-crashlytics

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, sourceType, imagegen-frontend-web, source

### Community 47 - "Community 47"
Cohesion: 0.13
Nodes (16): handler(), CANDIDATE_MODELS, extractAndParseJSON(), getApiKey(), handler(), run(), targetUrls, testAnalyzeLogsEndpoint() (+8 more)

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (8): Architecture & Project Structure, code:block1 (EatLog/), Design Spec: Firebase Project Initialization for EatLog, Error Handling & Security, Goals, Module Responsibilities, Overview, Verification Strategy

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (6): 1. Protected Branches, 2. Feature & Fix Branching, 3. Staging (`dev` Branch), 4. Production (`main` Branch) — Explicit Approval Required, 5. Verification Pipeline (Step-by-Step), EatLog — Strict CI/CD Git & Development Workflow

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (5): Firebase Project Initialization Plan, Task 1: Scaffold Configuration Files, Task 2: Install Firebase SDK Dependency, Task 3: Implement Modular Firebase Initialization Script, Task 4: Unit Test & Verification

### Community 105 - "Community 105"
Cohesion: 0.29
Nodes (6): 1. Codebase Understanding & Architecture (Graphify), 2. Strict CI/CD & Branching Rules, 3. Deployments (Dev & Prod), 4. Mandatory Post-Deployment Live UI & Backend API Verification, Agent Guidelines for EatLog, 4. Mandatory Post-Deployment Live UI / E2E Verification

### Community 106 - "Community 106"
Cohesion: 0.29
Nodes (5): app, auth, __dirname, __filename, firebaseConfig

### Community 107 - "Community 107"
Cohesion: 0.06
Nodes (41): AuthScreen(), LookupPanel(), OnboardingScreen(), deleteLookupFromHistory(), getLocalLookupHistory(), getLookupHistory(), saveLocalLookupHistory(), saveLookupToHistory() (+33 more)

### Community 108 - "Community 108"
Cohesion: 0.05
Nodes (42): 1. System Architecture & Components to Deploy, 2. Environments Overview, 3. Required Environment Variables, 4. Firestore Rules & Indexes: Deployment Lifecycle & Timing, 5. Firebase Authentication Setup (One-time per domain), 6. Playbook A: Deploy to Dev (Staging), 7. Playbook B: Deploy to Production (`prod`), 8. Troubleshooting & Recovery (+34 more)

### Community 110 - "Community 110"
Cohesion: 0.40
Nodes (4): apiSmoke, child, env, targetUrls

### Community 116 - "Community 116"
Cohesion: 0.08
Nodes (24): 10. Iconography, 11. Accessibility, 12. Do / Don't, 1. System Foundations, 2. Color Palette & Roles, 3. Typography, 4. Spacing, 5. Border Radius (+16 more)

### Community 117 - "Community 117"
Cohesion: 0.09
Nodes (22): 1. Layout & Spacing, 2. Alignment, 3. Accessibility, 4. Component Structure & Patterns, 5. Performance & Quality Checks, Before Shipping Any Component, Contrast, Data Displays (Macro Cards, Meal Rows, Charts) (+14 more)

### Community 136 - "Community 136"
Cohesion: 0.22
Nodes (8): Branch & Deployment Rules, EatLog UI Rules, Layer 1 — Layout Variance (Taste Skill), Layer 2 — Structural Best Practices (Web Design Guidelines), Layer 3 — Color & Typography Tokens (Design System), Mandatory Three-Layer Rule, Pre-Ship Checklist, Stack Constraints

### Community 148 - "Community 148"
Cohesion: 0.22
Nodes (11): clickedLinks, createdLinks, el, mockMeals, mockWeights, originalCreateElement, downloadCsv(), escapeCsv() (+3 more)

### Community 167 - "Community 167"
Cohesion: 0.10
Nodes (20): addFromLookupBtn, addWaterBtn, calendarBtn, closeBtn, editMealBtn, emailInput, exportBtn, json (+12 more)

### Community 168 - "Community 168"
Cohesion: 0.15
Nodes (10): DatePicker(), DAY_LABELS, MONTH_NAMES, buttons, { container }, day10Btn, handleClose, handleSelect (+2 more)

### Community 169 - "Community 169"
Cohesion: 0.15
Nodes (12): auth, authorizedDomains, providers, firestore, indexes, rules, hosting, ignore (+4 more)

### Community 172 - "Community 172"
Cohesion: 0.22
Nodes (8): dailyTab, form, goalsTab, input, lookupTab, staplesBtn, user, weeklyTab

### Community 173 - "Community 173"
Cohesion: 0.22
Nodes (8): aiRecalcBtn, deleteBtn, descInput, handlePin, mockLog, pinBtn, stapleLog, user

### Community 174 - "Community 174"
Cohesion: 0.18
Nodes (9): InsightsCard(), WeeklyView(), { container }, mockData, partialData, analyzeBtn, isoString, timeframeSelect (+1 more)

### Community 180 - "Community 180"
Cohesion: 0.25
Nodes (7): LandingPage(), applyBtn, cutBtn, handleGetStarted, heroCta, ribeyeBtn, user

### Community 183 - "Community 183"
Cohesion: 0.33
Nodes (5): connectBtn, exportBtn, exportSpy, saveBtn, user

### Community 184 - "Community 184"
Cohesion: 0.22
Nodes (9): computedHash, skillPath, source, sourceType, skillPath, sourceType, source, brandkit (+1 more)

### Community 186 - "Community 186"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, design-taste-frontend-v1

### Community 189 - "Community 189"
Cohesion: 0.25
Nodes (8): computedHash, skillPath, source, computedHash, skillPath, sourceType, firebase-app-hosting-basics, imagegen-frontend-mobile

### Community 190 - "Community 190"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, firebase-auth-basics

### Community 192 - "Community 192"
Cohesion: 0.25
Nodes (8): computedHash, skillPath, source, sourceType, computedHash, skillPath, firebase-basics, firebase-hosting-basics

### Community 193 - "Community 193"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, firebase-data-connect

### Community 196 - "Community 196"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, firebase-remote-config-basics

### Community 198 - "Community 198"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, full-output-enforcement

### Community 199 - "Community 199"
Cohesion: 0.25
Nodes (8): computedHash, source, sourceType, skillPath, source, sourceType, gpt-taste, redesign-existing-projects

### Community 200 - "Community 200"
Cohesion: 0.18
Nodes (11): skillPath, sourceType, computedHash, skillPath, source, design-taste-frontend, firebase-security-rules-auditor, xcode-project-setup (+3 more)

### Community 201 - "Community 201"
Cohesion: 0.40
Nodes (5): computedHash, skillPath, source, sourceType, image-to-code

### Community 205 - "Community 205"
Cohesion: 0.22
Nodes (9): sourceType, computedHash, skillPath, source, sourceType, skills, firebase-firestore, minimalist-ui (+1 more)

### Community 207 - "Community 207"
Cohesion: 0.18
Nodes (11): source, sourceType, computedHash, skillPath, source, sourceType, high-end-visual-design, industrial-brutalist-ui (+3 more)

## Knowledge Gaps
- **348 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+343 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `skills` connect `Community 205` to `Community 192`, `Community 193`, `Community 196`, `Community 198`, `Community 199`, `Community 200`, `Community 201`, `Community 10`, `Community 11`, `Community 207`, `Community 184`, `Community 186`, `Community 189`, `Community 190`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Community 0` to `Community 8`, `Community 107`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `db` connect `Community 107` to `Community 0`, `Community 5`, `Community 7`, `Community 8`, `Community 174`, `Community 148`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _348 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._