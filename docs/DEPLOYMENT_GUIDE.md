# EatLog Full-Stack Deployment Guide & Runbook

This document serves as the **single source of truth** for deploying EatLog to **Development (Staging)** and **Production** environments. Any developer or AI agent instructed to "Deploy to dev" or "Deploy to prod" must follow the corresponding playbook below.

---

## 1. System Architecture & Components to Deploy

EatLog consists of three core components that work together:

```
                  ┌──────────────────────────────────────────────┐
                  │                 Vercel Host                  │
                  │                                              │
                  │  ┌────────────────────┐  ┌────────────────┐  │
                  │  │ Vite React 19 SPA  │  │ Serverless API │  │
                  │  │ (Frontend Client)  │  │ (/api/*)       │  │
                  │  └─────────┬──────────┘  └───────┬────────┘  │
                  └────────────┼─────────────────────┼───────────┘
                               │                     │
                Client Auth &  │                     │ Server-side
                Direct Storage │                     │ Gemini 3.6 Flash / 3.5 Flash
                               ▼                     ▼
                  ┌───────────────────────┐  ┌───────────────────┐
                  │   Firebase Project    │  │  Google AI Studio │
                  │  - Firebase Auth      │  │  (GEMINI_API_KEY) │
                  │  - Cloud Firestore    │  └───────────────────┘
                  │  - Security Rules     │
                  │  - Composite Indexes  │
                  └───────────────────────┘
```

| Component | Technology | Target Host / Platform | Artifacts / Source Files |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React 19, Vite, Tailwind CSS, PWA | **Vercel** | `src/`, `index.html`, `public/`, `vite.config.js` |
| **Serverless API** | Node.js Serverless Functions | **Vercel Functions** | `api/logMeal.js`, `api/analyzeLogs.js` |
| **Database & Auth** | Cloud Firestore & Firebase Auth | **Firebase** | `firestore.rules`, `firestore.indexes.json`, `.firebaserc` |
| **Multimodal AI** | Gemini 3.6 Flash / 3.5 Flash | **Google Generative AI** | Key configured in Vercel environment variables |

---

## 2. Environments Overview

| Parameter | Development / Staging (`dev`) | Production (`prod`) |
| :--- | :--- | :--- |
| **Target Git Branch** | `dev` | `main` |
| **Firebase Project Alias** | `dev` | `production` / `default` |
| **Firebase Project ID** | `eatlog-dev` | `eatlog-924b6` |
| **Vercel Environment** | Preview / Development | Production |
| **Primary Domain** | `eat-log-git-dev-omkar-chavans-projects.vercel.app` | `eattlog.vercel.app` / `eat-log-omkar-chavans-projects.vercel.app` |
| **Env File Reference** | `.env.development` / `.env.local` | `.env.production` |
| **Approval Rule** | Automatic via PR or push to `dev` | **Requires explicit human user approval** |

---

## 3. Required Environment Variables

All environment variables must be configured in your **Vercel Project Settings** (`Settings → Environment Variables`).

### Environment Matrix

| Variable Name | Client / Server | Required For | Dev / Preview Value | Production Value |
| :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-only (`/api/*`) | Multimodal food logging & nutritional insights | AI Studio Key (Dev/Test) | AI Studio Key (Production) |
| `VITE_FIREBASE_API_KEY` | Client (`src/`) | Firebase Client SDK initialization | `eatlog-dev` API key | `eatlog-924b6` API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client (`src/`) | Firebase Auth redirects & logins | `eatlog-dev.firebaseapp.com` | `eatlog-924b6.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Client (`src/`) | Firestore connection | `eatlog-dev` | `eatlog-924b6` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Client (`src/`) | Storage bucket | `eatlog-dev.firebasestorage.app` | `eatlog-924b6.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Client (`src/`) | Cloud messaging | Dev Sender ID | Prod Sender ID |
| `VITE_FIREBASE_APP_ID` | Client (`src/`) | Web App App ID | Dev App ID | Prod App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Client (`src/`) | Analytics (Optional) | Dev Measurement ID | Prod Measurement ID |

> [!IMPORTANT]
> - Never prefix `GEMINI_API_KEY` with `VITE_`. It must remain secure on the server side in `/api/` Vercel Functions.
> - Ensure **Preview** environment is checked for dev values and **Production** is checked for production values in Vercel.

---

## 4. Firestore Rules & Indexes: Deployment Lifecycle & Timing

### Why aren't Rules and Indexes deployed automatically by Git / Vercel?
- **Vercel** only deploys frontend static assets and serverless functions in `/api/`.
- **Firebase** (Firestore security rules & composite indexes) runs as an independent cloud service. Pushing to Git or deploying to Vercel **does not update Firebase**.
- Therefore, rules and indexes **must be deployed explicitly via Firebase CLI scripts** (`npm run deploy:firestore:*`).

```
              ┌─── Git Push to origin/dev / main ───► Vercel (Auto Deploys UI & API)
Code Change ──┤
              └─── npm run deploy:firestore:*  ─────► Firebase (Deploys Rules & Indexes)
```

### When MUST Rules and Indexes be deployed?

| Component | File | Trigger Condition / When to Deploy | What Happens If You Don't Deploy |
| :--- | :--- | :--- | :--- |
| **Security Rules** | `firestore.rules` | • Whenever adding a new Firestore collection (e.g. `lookup_history`).<br>• Whenever modifying read/write permission conditions or ownership logic.<br>• Whenever adding new document schema validation. | Users encounter `FirebaseError: Missing or insufficient permissions` on app features. |
| **Composite Indexes** | `firestore.indexes.json` | • Whenever creating Firestore queries with multiple conditions, e.g. `.where('userId', '==', ...).orderBy('createdAt', 'desc')`.<br>• Whenever adding group collection queries. | Compound queries crash with `FirebaseError: The query requires an index. You can create it here: https://...` |

> [!NOTE]
> **Index Build Time**: When you deploy a new composite index, Cloud Firestore builds the index in the background (typically taking 1 to 5 minutes). Queries using that index will succeed as soon as index status turns *Enabled* in Firebase Console.

### Available Deployment Commands

```powershell
# Deploy BOTH Rules and Indexes at once (Recommended)
npm run deploy:firestore:dev    # Deploy to eatlog-dev
npm run deploy:firestore:prod   # Deploy to eatlog-924b6

# Deploy ONLY Rules
npm run deploy:rules:dev        # Deploy to eatlog-dev
npm run deploy:rules:prod       # Deploy to eatlog-924b6

# Deploy ONLY Indexes
npm run deploy:indexes:dev      # Deploy to eatlog-dev
npm run deploy:indexes:prod     # Deploy to eatlog-924b6
```

---

## 5. Firebase Authentication Setup (One-time per domain)

Whenever a new custom domain or preview domain is introduced, ensure it is added to Firebase Authorized Domains:

1. Open **Firebase Console** → Select Project (`eatlog-dev` or `eatlog-924b6`).
2. Go to **Authentication** → **Settings** → **Authorized domains**.
3. Confirm the following domains exist:
   - `localhost`
   - `eattlog.vercel.app`
   - `eat-log-omkar-chavans-projects.vercel.app`
   - `eat-log-git-dev-omkar-chavans-projects.vercel.app`
   - Any wildcards or preview branch domains generated by Vercel.

---

## 6. Playbook A: Deploy to Dev (Staging)

Follow these exact steps when asked to **"Deploy to dev"**:

### Step 1: Pre-deployment Local Verification
Run test suites to ensure everything compiles and passes:
```powershell
# 1. Run unit tests
npm run test

# 2. Run e2e tests
npm run test:e2e
```

### Step 2: Deploy Firestore Rules and Indexes to Dev
Deploy the security rules (`firestore.rules`) and compound indexes (`firestore.indexes.json`) to the `eatlog-dev` project:
```powershell
npm run deploy:firestore:dev
```
*(Alternative granular commands)*:
- `npm run deploy:rules:dev`
- `npm run deploy:indexes:dev`

### Step 3: Push to `dev` Branch (Triggers Vercel Preview Deploy)
```powershell
git checkout dev
git add .
git commit -m "feat/fix: <description of changes>"
git push origin dev
```

### Step 4: Verify Deployment
1. Check Vercel dashboard or CLI output for deployment URL: `https://eat-log-git-dev-omkar-chavans-projects.vercel.app`.
2. Run smoke tests / E2E against the preview environment:
```powershell
$env:BASE_URL="https://eat-log-git-dev-omkar-chavans-projects.vercel.app"
npx playwright test
```

---

## 7. Playbook B: Deploy to Production (`prod`)

> [!CAUTION]
> **Production Guard**: NEVER deploy or merge to `main` without explicit human user permission.

Follow these exact steps when asked to **"Deploy to prod"**:

### Step 1: Verify All Tests Pass on Dev
```powershell
# Ensure working branch is dev and clean
git checkout dev
git pull origin dev

# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

### Step 2: Deploy Firestore Rules and Indexes to Production
Deploy the rules and indexes to the production Firebase project (`eatlog-924b6`):
```powershell
npm run deploy:firestore:prod
```
*(Alternative granular commands)*:
- `npm run deploy:rules:prod`
- `npm run deploy:indexes:prod`

### Step 3: Merge `dev` into `main` and Push
```powershell
# Switch to main
git checkout main
git pull origin main

# Merge dev into main
git merge dev --no-ff -m "chore: release to production"

# Push to origin/main (Triggers Vercel Production Deployment)
git push origin main
```

*(Alternative Manual Vercel Production Deploy via CLI if not using git trigger)*:
```powershell
npx vercel --prod
```

### Step 4: Post-Production Verification & Smoke Test
1. Visit production URL: `https://eattlog.vercel.app`.
2. Verify:
   - User authentication (Google Sign-In & Email/Password).
   - Logging a meal with image upload & text analysis (`/api/logMeal`).
   - Requesting nutritionist insights (`/api/analyzeLogs`).
   - Real-time Firestore sync on Daily Logs, Water, Weight, and Quick Lookup history.
   - PWA service worker installation.

---

## 8. Troubleshooting & Recovery

### Issue 1: Gemini API 503 / Rate Limits
- **Cause**: AI Studio rate limit reached or model temporary degradation.
- **Remedy**: The backend (`api/logMeal.js` and `api/analyzeLogs.js`) has automatic fallback from `gemini-3.5-flash` to `gemini-3.5-flash-lite`. Ensure `GEMINI_API_KEY` is valid and active in Vercel.

### Issue 2: Missing Firestore Composite Index
- **Symptom**: Query fails with `FirebaseError: The query requires an index`.
- **Remedy**: Click the direct index creation URL in browser console logs, or ensure `firestore.indexes.json` contains the required index and run:
  ```powershell
  npm run deploy:indexes:prod   # (or dev)
  ```

### Issue 3: Firebase Auth `auth/unauthorized-domain`
- **Symptom**: User cannot sign in on Vercel preview or custom domain.
- **Remedy**: Add the exact domain hostname to Firebase Console → Authentication → Settings → Authorized domains.

### Issue 4: Rollback Strategy
- **Frontend / Serverless API**: Go to Vercel Dashboard → Deployments → Select previous stable deployment → Click **"Instant Rollback"** / **"Promote to Production"**.
- **Firestore Rules**: Revert `firestore.rules` in git and re-run `npm run deploy:rules:prod`.
