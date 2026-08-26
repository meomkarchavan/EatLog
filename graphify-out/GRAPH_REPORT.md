# Graph Report - EatLog  (2026-08-26)

## Corpus Check
- 146 files · ~79,686 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1083 nodes · 1103 edges · 107 communities (96 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9eacc637`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]

## God Nodes (most connected - your core abstractions)
1. `useToast()` - 17 edges
2. `Firebase Authentication Web SDK` - 15 edges
3. `auth` - 12 edges
4. `db` - 11 edges
5. `scripts` - 10 edges
6. `Flutter SDK` - 10 edges
7. `Web SDK` - 10 edges
8. `Firebase AI Logic Basics` - 9 edges
9. `Configuration Reference` - 9 edges
10. `iOS SDK` - 9 edges

## Surprising Connections (you probably didn't know these)
- `TestConsumer()` --calls--> `useToast()`  [EXTRACTED]
  tests/unit/Toast.test.jsx → src/components/Toast.jsx
- `ProfileScreen()` --calls--> `useToast()`  [EXTRACTED]
  src/components/ProfileScreen.jsx → src/components/Toast.jsx
- `Dashboard()` --calls--> `useToast()`  [EXTRACTED]
  src/components/Dashboard.jsx → src/components/Toast.jsx
- `Dashboard()` --calls--> `calculateNutritionTargets()`  [EXTRACTED]
  src/components/Dashboard.jsx → src/utils/nutritionMath.js
- `LookupPanel()` --calls--> `useToast()`  [EXTRACTED]
  src/components/LookupPanel.jsx → src/components/Toast.jsx

## Import Cycles
- None detected.

## Communities (107 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (33): AuthScreen(), Dashboard(), formatLocalDate(), InsightsCard(), LookupCard(), LookupPanel(), MealCard(), Profile() (+25 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (39): dependencies, firebase, @google/generative-ai, lucide-react, react, react-activity-calendar, react-dom, recharts (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (26): Aliases, Basic Query, Contents, Create, Create with Server Values, Delete, Embedded Queries, Expression Operators (Compare with Server Values) (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (24): Advanced Features, App Check, App Check Debug Tokens for Local Development & CI/CD, Chat Session (Multi-turn), CI/CD Pipelines (Pre-Provisioned), Core Capabilities, Firebase AI Logic Basics, Generate Images with Nano Banana (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (24): Breaking Changes, CI/CD Integration, Cloud SQL Configuration, Configuration Reference, Connect from SDK, connector.yaml, Contents, dataconnect.yaml (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (24): Access Levels, Anti-Patterns, @auth Directive, auth.token Fields, Authorization Data Lookup, Authorization Patterns, Available Bindings, CEL Expressions (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (20): Advanced aggregation with RANK, Advanced CTE with upserts (atomic get-or-create), Basic SELECT with field aliasing, Basic UPDATE, Blog with Permissions, E-Commerce Store, Examples, Movie Review App (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (20): @col, Contents, Core Directives, Customizing Tables, Data Types, @default, Defining Types, Enumerations (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (17): 1. Query Formats (`queryFormat` argument), 1. Vector Similarity Search (Semantic), 2. Full-Text Search (Lexical), 2. Relevance Thresholding (`relevanceThreshold` and `_metadata.relevance`), A. Auto-Embedding Search, A. Generation on Insert, Automatic Embedding Generation (`_embed` server value), B. Custom Vector Search (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (16): Add a Document with Auto-ID (`addDoc`), Firestore Web SDK Usage Guide, Get a Single Document (`getDoc`), Get Multiple Documents (`getDocs`), Handle Changes (Added/Modified/Removed), Initialization, Listen to a Document/Query (`onSnapshot`), Order and Limit (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (15): Connect to Emulator, Email Link Authentication, Firebase Authentication Web SDK, Initialization, Observe Auth State, Sign In Anonymously, Sign In with Apple (Popup), Sign In with Facebook (Popup) (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (15): 1. High Write Rates (Sequential Values), 2. Large String/Map/Array Fields, 3. TTL Fields, Automatic vs. Manual Management, Best Practices & Exemptions, CLI Commands, Composite Indexes, Config files (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (14): 1. Import and Initialize, 2. Type-Safe Data Models (Codable), 3. Basic CRUD Operations, 4. Pipeline Queries, 5. Realtime Listeners in SwiftUI (Lifecycle Best Practices), ⛔️ CRITICAL RULE: NO FirebaseFirestoreSwift ⛔️, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Examples (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (14): 1. Generate Firestore Rules, 3. Strict Path and Relationship Scoping, 4. Secure Counter Updates, 5. **CRITICAL** Ensure Application Validity, Advanced Validation for Business Logic, Critical Constraints, Critical Directives for Secure Generation, **CRITICAL** RBAC Guidelines (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (14): 1. Define Data Model (`schema/schema.gql`), 2. Define Authorized Operations (`connector/queries.gql`, `connector/mutations.gql`), 3. Use type-safe SDK in your apps, Deployment & CLI, Development Workflow, Examples, Feature Capability Map, Firebase SQL Connect (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (14): Best Practices for Agents, Calling Operations, Client-Side Caching, Data Type Mapping Reference, Initialization, Installation, Resilient Enum Handling, Subscriptions (Realtime) (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (14): App Hosting CLI Commands, Automated deployment via GitHub (CI/CD), Backend Management, Initialization, `npx -y firebase-tools@latest apphosting:backends:create`, `npx -y firebase-tools@latest apphosting:backends:delete <backend-id>`, `npx -y firebase-tools@latest apphosting:backends:get <backend-id>`, `npx -y firebase-tools@latest apphosting:backends:list` (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (14): 1. Per-Function Configuration, 2. Global Configuration (`setGlobalOptions`), 3. Migrating Environment Configurations (`functions.config()`), Advanced Interpolation & Logic, Built-ins, Common Property Translations, Deterministic Rules for Migration, Initialization & Scope (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (14): 1. Generate Firestore Rules, 3. Strict Path and Relationship Scoping, 4. Secure Counter Updates, 5. **CRITICAL** Ensure Application Validity, Advanced Validation for Business Logic, Critical Constraints, Critical Directives for Secure Generation, **CRITICAL** RBAC Guidelines (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (14): 1. The Anti-Ruby Mandate, 2. Modern Xcode Folder Synchronization, 3. Allowed Scripting Languages, 4. Toolchain Verification, 5. Mandatory Linker Flags for Static Frameworks (Firebase), **CRITICAL: Always Use Latest SDK Version**, ⛔️ CRITICAL RULES & ENVIRONMENT CHECKS, Empty Directory Workflow (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (13): Add a Document with Auto-ID, Get a Single Document, Get Multiple Documents, Order and Limit, Pipeline Queries, Python SDK Usage, Queries, Reading Data (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (13): 1. Declarative IAM & APIs (Zero-Local-Overhead), 2. Global Parameter Access Restriction, 3. V2 Concurrency & Cost Parity, Core Rules & Constraints, Extension to Functions Codebase & npm Package Migration, Overview, Step 1: Inventory Extension Resources, Step 2: Configure `package.json` (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (13): 1. Cloud Firestore, 2. Cloud Storage, 3. Realtime Database, 4. Remote Config, Architectural Deep Dive: Destructuring Compatibility Shim, Best Practices for AI Agents, Example Transformation, How it Works (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (12): Basic CRUD Schema, Client Subscribe (Web), connector.yaml Template, dataconnect.yaml Template, Event-Driven Refresh, Firebase Init Commands, Many-to-Many Relationship, Realtime Query Templates (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (12): Accessing User Authentication Context, Auth Context Mappings, Auth Extraction Example, Cloud Functions Integration Reference, Comprehensive Example, Core Trigger Configuration, 🚨 Critical Infinite Loop Constraint, Event Filtering (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (12): 1. Local Prototyping: Data Seeding, 2. Production: Admin SDK Bulk Operations, 3. Production: Bulk Operations via raw SQL, 🚨 Critical SQL Operations Constraint, Data Seeding & Bulk Operations Reference, Resetting Seed Data, SDK Bulk APIs Features:, SDK Bulk Operations Example (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (12): CEL Bindings in Conditions, Combining Multiple @refresh Directives, Common Patterns, Contents, Explicit Mutation Signals (`onMutationExecuted`), Implicit Entity Refresh signals, `mutation` — The Triggering Event, Realtime Reference (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (12): Basic Query, Best Practices for Agents, Calling Operations, Client-Side Caching, Data Type Mapping Reference, Flutter SDK, Imports, Initialization (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (12): Basic Query, Best Practices for Agents, Calling Operations, Client-Side Caching, Data Type Mapping Reference, Dependencies (Package.swift or SPM), Initialization, iOS SDK (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (11): 1. Re-running `flutterfire configure` Upon Renaming, 2. Platform-Specific Build Requirements, 3. Web CORS Best Practices, 4. Elaborating on `WidgetsFlutterBinding.ensureInitialized()`, Flutter & Firebase Setup Guide, Prerequisites, Step 1: Create a Flutter Project, Step 2: Configure Firebase (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.38
Nodes (8): ProfileScreen(), ACTIVITY_MODIFIERS, calculateBMI(), calculateBMR(), calculateTargets(), calculateTDEE(), getBMICategory(), GOAL_MODIFIERS

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): 1. Provisioning, 2. Client Setup & Usage, 3. Security Rules, Core Concepts, Identity Providers, Option 1. Enabling Authentication via CLI, Option 2. Enabling Authentication in Console, Prerequisites (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (10): 0. Create an Android application, 1. Create a Firebase Project, 2. Register Your Android App, 3. Download `google-services.json`, Before running these commands, ensure you are authenticated: `npx -y firebase-tools@latest login` (or `npx -y firebase-tools@latest login --no-localhost` on remote servers), Fetch the configuration file using the App ID (which is printed in the output of the previous command): `npx -y firebase-tools@latest apps:sdkconfig ANDROID <APP_ID> --project <PROJECT_ID>` *Example output extraction to file:* ` # (Output must be saved as app/google-services.json)`, 🛠️ Firebase Android Setup Guide, Manual Verification (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (10): `cleanUrls` (Optional), Full Example, `headers` (Optional), Hosting Configuration (`firebase.json`), `ignore` (Optional), Key Attributes, `public` (Required), `redirects` (Optional) (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (10): 1. Initialization, 2. Decision Framework: Mandatory Pipeline Architecture, 3. Pipeline Examples, 4. Real-Time Listener & Document Operations, Add Dependencies, Android SDK Usage (Enterprise Native Mode), Full-Text Search, Initialize Firestore (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (10): Best Practices and Template Management, Fetching Strategies, Handling npx 403 Forbidden Errors, Handling Project Context Issues, Prerequisites, Remote Config, SDK Setup, Template Management via CLI (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (10): Android SDK, Basic Query, Best Practices for Agents, Calling Operations, Client-Side Caching, Data Type Mapping Reference, Dependencies (build.gradle.kts), Initialization (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (10): 1. Import and Initialize, 2. Type-Safe Data Models (Codable), 3. Writing Data (Modern Concurrency & Codable), 4. Reading Data (Modern Concurrency & Codable), 5. Realtime Listeners in SwiftUI (Lifecycle Best Practices), ⛔️ CRITICAL RULE: NO FirebaseFirestoreSwift ⛔️, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Firebase Firestore iOS Setup Guide (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (9): Add Dependencies to Gradle Build, App-level `build.gradle.kts` (`<project>/<app-module>/build.gradle.kts`), Follow up Steps, Project and App Setup, Project-level `build.gradle.kts` (`<project>/build.gradle.kts`), Firebase Crashlytics Android Setup Guide, Optional: Add custom debugging information, Optional: Install the NDK SDK to capture native crashes (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.20
Nodes (9): CLI Commands, Config files, Firestore Indexes Reference, Index Density, Index Ordering, Index Structure, Management, Query Support Examples (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (9): 1. Impersonating an Unauthenticated User, 2. Impersonating a Specific User (Cloud Functions), 3. Impersonating a Specific User (Plain HTTP), 4. Running with Unrestricted Access, Admin Node SDK, Best Practices for Agents, Configuration in `connector.yaml`, Generation (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (9): 1, Enable Authentication via CLI, 2. Add Dependencies, 3. Initialize FirebaseAuth, 4. Check Current Auth State, 5. Sign Up New Users (Email/Password), 6. Sign In Existing Users (Email/Password), 7. Sign Out, Firebase Authentication on Android (Kotlin) (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (9): 1. Add Dependencies, 2. Initialize Firestore, 3. Add Data, 4. Read Data, 5. Update Data, 6. Delete Data, Cloud Firestore on Android (Kotlin), Enable Firestore via CLI (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): 1. Import and Initialize, 2. Authentication State, 3. Email and Password Authentication (Modern Concurrency), 4. Sign Out, ⛔️ CRITICAL RULE: NO INLINE INITIALIZATION ⛔️, Firebase Auth iOS Setup Guide, Sign In, Sign Up

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (8): 1. Create a Firebase Project and App (Automated), 2. Installation (Automated via Swift Package Manager CLI), 3. Initialization, AppDelegate (Traditional / UIKit), ⛔️ CRITICAL RULE: INITIALIZATION ORDER ⛔️, ⛔️ CRITICAL RULE: STATE MANAGEMENT (OBSERVATION VS COMBINE) ⛔️, Firebase iOS Setup Guide, SwiftUI (Modern - SAFE PATTERN)

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (8): Add Swift Package Dependencies, Follow up Steps, Initialize Firebase in App Code, Project and App Setup, Add dSYM Upload Script, Firebase Crashlytics iOS Setup Guide, Optional: Add custom debugging information, Required: Force a Test Crash

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): Add Dependencies to Gradle Build, App-level `build.gradle.kts` (`<project>/<app-module>/build.gradle.kts`), Follow up Steps, Project and App Setup, Project-level `build.gradle.kts` (`<project>/build.gradle.kts`), Fetch and Activate Values, Firebase Remote Config Android Setup Guide, Set In-App Defaults

### Community 47 - "Community 47"
Cohesion: 0.31
Nodes (5): CANDIDATE_MODELS, extractAndParseJSON(), getApiKey(), handler(), mockGenerateContent

### Community 48 - "Community 48"
Cohesion: 0.31
Nodes (5): DatePicker(), DAY_LABELS, MONTH_NAMES, pad(), toDateStr()

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (8): Collection Group Support, Collections, Document Data Model, Documents, Examples, Firestore Data Model Reference, Subcollections, Use Cases

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (8): 1. Create a Firestore Enterprise Database, 2. Create `firebase.json`, 2. Create `firestore.rules`, 3. Create `firestore.indexes.json`, Deploy rules and indexes, Local Emulation, Manual Initialization, Provisioning Firestore Enterprise Native Mode

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (8): 1. Initialization, 2. Decision Framework: Pipelines vs. Standard Queries, 3. Pipeline Examples, 4. Real-Time Listener & Document Operations, Full-Text Search, Relational Joins Pattern, Rules & Accountability, Web SDK Usage (Enterprise Native Mode)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (8): Core Agent Constraints, Mutation Fields (DML), Native SQL Operations, Native SQL Root Fields, PostgreSQL Extensions, Query Fields (Read-Only), ⚠️ Security: Stored Procedures & Dynamic SQL, Syntax rules & limitations

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (8): Auth (Blocking), Cloud Firestore, Cloud Pub/Sub, Cloud Storage, Cloud Tasks, Firebase Functions V1 vs V2 Signature Mapping, HTTP / Callables, Realtime Database

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (8): 0. Enable Firebase AI Logic via CLI, 1. Add Dependencies, 2. Initialize and Generate Content, 3. Multimodal Input (Text and Images), 4. Chat Session (Multi-turn), 5. Streaming Responses, Firebase AI Logic on Android (Kotlin), Jetpack Compose (Modern)

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (7): 1. Import and Initialize, 2. SwiftUI Integration (Best Practices), 3. Safety Settings, Advanced Features, Chat Session (Multi-turn), Firebase AI Logic iOS Setup Guide, Function Calling (Tools)

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): 1. `google_sign_in` 7.2.0 API Changes, 2. Initialization & Web Hang/Crash Pitfalls, 3. Web Logout Crashes, 4. Prototyping Workaround: Bypassing Firestore Composite Indices, 5. Robust `AuthService` Boilerplate, 6. Troubleshooting `auth/unauthorized-domain` on Flutter Web, Firebase Auth & Google Sign-In for Flutter

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (7): Add Swift Package Dependencies, Follow up Steps, Initialize Firebase in App Code, Project and App Setup, Fetch and Activate Values, Firebase Remote Config iOS Setup Guide, Set In-App Defaults

### Community 58 - "Community 58"
Cohesion: 0.25
Nodes (7): App Hosting Basics, Automated deployment via GitHub (CI/CD), Deploy from Source, Deploying to App Hosting, Description, Emulation, Hosting vs App Hosting

### Community 59 - "Community 59"
Cohesion: 0.25
Nodes (7): 1. Instance Selection and Edition Detection, 2. Specialized Guides, A. Instance Found, B. No Instance Found (or New Requested), Cloud Firestore Database and Operations, Enterprise Edition / Native Mode (`references/enterprise/`), Standard Edition (`references/standard/`)

### Community 60 - "Community 60"
Cohesion: 0.25
Nodes (7): 1. Configuration (`firebase.json`), 2. Deploying, 3. Emulation, hosting-basics, Hosting vs App Hosting, Instructions, Overview

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (7): Authentication in Security Rules, Basic Checks, Check if user is signed in, Check if user owns the data, Check if user owns the document (field-based), Example: Email Verification Check, Token Properties

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (7): Advanced Features, Chat Session (Multi-turn), Core Capabilities, Firebase AI Logic Basics, Initialization Pattern, Multimodal (Text + Images/Audio/Video/PDF input), Streaming Responses

### Community 63 - "Community 63"
Cohesion: 0.25
Nodes (7): 1. Configure and Verify Firebase MCP Server, 1. Install and Verify Firebase Extension, 2. Restart and Verify Connection, 2. Restart and Verify Connection, Alternative: Manual MCP Configuration (Project Scope), Gemini CLI Setup, Recommended: Installing Extensions

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (7): Architecture & Project Structure, Design Spec: Firebase Project Initialization for EatLog, Error Handling & Security, Goals, Module Responsibilities, Overview, Verification Strategy

### Community 65 - "Community 65"
Cohesion: 0.25
Nodes (7): 1. Create `firebase.json`, 2. Create `firestore.rules`, 3. Create `firestore.indexes.json`, Deploy database, rules and indexes, Local Emulation, Manual Initialization, Provisioning Cloud Firestore

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (6): Chat Session, Flutter Setup for Firebase AI Logic, Initialization, Installation, Text Generation, Usage

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (6): 1. Protected Branches, 2. Feature & Fix Branching, 3. Staging (`dev` Branch), 4. Production (`main` Branch) — Explicit Approval Required, 5. Verification Pipeline (Step-by-Step), EatLog — Strict CI/CD Git & Development Workflow

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (6): 1. Setup, 2. Best Practices: Type-Safe Models, 3. The Service Layer, 4. Listening to Streams in the UI (`StreamBuilder`), Cloud Firestore in Flutter, Initialization & References

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (6): Admin Bootstrapping & Privileges:, Assessment: Security Validator (Red Team Edition), Mandatory Audit Checklist:, Overview, Scoring Criteria, Scoring Criteria (1-5):

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (6): Cloning to Live, Deploy to a Preview Channel, Deploying to Firebase Hosting, Expiration, Preview Channels, Standard Deployment

### Community 71 - "Community 71"
Cohesion: 0.29
Nodes (6): 1. Setup, 2. Best Practices: Type-Safe Models, 3. The Service Layer, 4. Listening to Streams in the UI (`StreamBuilder`), Cloud Firestore in Flutter, Initialization & References

### Community 72 - "Community 72"
Cohesion: 0.33
Nodes (5): App Hosting Configuration (`apphosting.yaml`), `env` (Environment Variables), File Structure, Resource Constraints, `runConfig`

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (5): Firebase Project Initialization Plan, Task 1: Scaffold Configuration Files, Task 2: Install Firebase SDK Dependency, Task 3: Implement Modular Firebase Initialization Script, Task 4: Unit Test & Verification

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (5): 1. Verify Node.js, 2. Verify Firebase CLI, 3. Verify Firebase Authentication, 4. Install Agent Skills and MCP Server, Firebase Local Environment Setup

### Community 75 - "Community 75"
Cohesion: 0.33
Nodes (5): 1. Create a Firebase Project and App, 2. Installation, 3. Initialization, 4. Using Services, Firebase Web Setup Guide

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (5): 1. Install and Verify Firebase Skills, 2. Configure and Verify Firebase MCP Server, 3. Restart and Verify Connection, GitHub Copilot Setup, Recommended: Global Setup

### Community 77 - "Community 77"
Cohesion: 0.33
Nodes (5): 1. Install and Verify Firebase Skills, 2. Configure and Verify Firebase MCP Server, 3. Restart and Verify Connection, Other Agents Setup, Recommended: Global Setup

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (4): Common Issues, Firebase Usage Principles, Prerequisites, References

### Community 79 - "Community 79"
Cohesion: 0.40
Nodes (4): Crashlytics, Prerequisites, SDK Setup, SDK Usage

### Community 80 - "Community 80"
Cohesion: 0.40
Nodes (4): App Hosting Emulation, Capabilities, Configuration: `apphosting.emulator.yaml`, Running the Emulator

### Community 81 - "Community 81"
Cohesion: 0.40
Nodes (4): 1. Install and Verify Firebase Skills, 2. Configure and Verify Firebase MCP Server, 3. Restart and Verify Connection, Antigravity Setup

### Community 82 - "Community 82"
Cohesion: 0.40
Nodes (4): 1. Install and Verify Plugins, 2. Restart and Verify Connection, Claude Code Setup, Recommended Method: Using Plugins

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (4): 1. Install and Verify Firebase Skills, 2. Configure and Verify Firebase MCP Server, 3. Restart and Verify Connection, Cursor Setup

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (3): 1. Development & Staging Flow, 2. Strict Production / `main` Branch Rule, Development & Deployment Workflow Rules

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (3): Android Studio Setup, MCP Setup, Skills Installation

### Community 105 - "Community 105"
Cohesion: 0.50
Nodes (3): 1. Codebase Understanding & Architecture (Graphify), 2. Strict CI/CD & Branching Rules, Agent Guidelines for EatLog

### Community 106 - "Community 106"
Cohesion: 0.31
Nodes (5): CANDIDATE_MODELS, extractAndParseJSON(), getApiKey(), handler(), mockGenerateContent

## Knowledge Gaps
- **647 isolated node(s):** `CANDIDATE_MODELS`, `CANDIDATE_MODELS`, `name`, `version`, `private` (+642 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `auth` connect `Community 0` to `Community 30`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Community 0` to `Community 30`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `CANDIDATE_MODELS`, `CANDIDATE_MODELS`, `name` to the rest of the system?**
  _647 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05432098765432099 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._