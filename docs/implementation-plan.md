# Implementation Plan: Injibara Campus Lost & Found

## Repository & Environment Assessment
- **Workspace Path:** `c:\Users\HP-PC\OneDrive\Desktop\campus-lost-found1`
- **Initial State:** Empty directory. Fresh greenfield monorepo setup.
- **Target Platform:** Android mobile app (React Native + Expo SDK 51/52) + Node.js/Express TypeScript REST API + PostgreSQL (Prisma ORM).
- **Organization Name:** Injibara University (English default, Amharic i18n structure).

---

## Architecture Overview
The project is structured as a full-stack monorepo:
```
campus-lost-found/
├── mobile/                 # React Native / Expo Mobile Client
│   ├── app/                # Expo Router file-based screens
│   ├── src/                # Core logic, components, theme, i18n, state
│   ├── assets/             # Brand logos, icons, placeholders
│   ├── package.json
│   ├── tsconfig.json
│   └── app.config.ts
├── backend/                # Express TypeScript REST API
│   ├── src/                # Layered: Routes -> Controllers -> Services -> Repositories/Prisma
│   ├── prisma/             # Prisma schema, migrations, seeds
│   ├── tests/              # Jest + Supertest suites
│   ├── package.json
│   └── tsconfig.json
├── database/               # SQL scripts & docs
├── docs/                   # Comprehensive documentation
├── docker-compose.yml      # Local PostgreSQL container definition
└── package.json            # Monorepo root scripts
```

---

## Phase-by-Phase Roadmap

### Phase 1: Inspection & Planning (Current)
- [x] Inspect directory and runtime environment.
- [x] Establish architecture and baseline standards.
- [x] Create initial `docs/implementation-plan.md`.

### Phase 2: Monorepo & Configuration Scaffolding
- [ ] Root `package.json` with npm workspaces and orchestration scripts.
- [ ] Docker Compose for PostgreSQL 16.
- [ ] Root and project-level `.gitignore`, `.editorconfig`, `.env.example`.
- [ ] Backend scaffolding (`backend/package.json`, `tsconfig.json`, `jest.config.ts`).
- [ ] Mobile scaffolding (`mobile/package.json`, `tsconfig.json`, `app.config.ts`).

### Phase 3: Database & Data Modeling (Prisma + PostgreSQL)
- [ ] Prisma schema with entities:
  - `User` (Role: USER, ADMIN, SECURITY_OFFICER, refresh sessions, hashed passwords).
  - `Category` (Predefined & customizable categories).
  - `Location` (Injibara University campus locations with coordinates).
  - `Item` (LOST/FOUND, storage location, private verification detail `hiddenDetail`, expiration).
  - `ItemImage` (Up to 3 images per item).
  - `Claim` (Evidence, answers, photo, handover details, review notes).
  - `StatusHistory` (Audit trail for item & claim lifecycle).
  - `Notification` (In-app notifications for claims, handovers, matches).
  - `AuditLog` (Administrative and privileged actions).
- [ ] Seed script with Injibara University campus locations, default item categories, and admin bootstrap.

### Phase 4: Backend Foundation & Middleware
- [ ] Express app configuration (`backend/src/app.ts`, `server.ts`).
- [ ] Security headers (Helmet), CORS, JSON body parser.
- [ ] Centralized error handling and standard JSON response envelopes (`success`, `message`, `data`/`errors`).
- [ ] Multer upload handling with file type and size constraints.
- [ ] Request rate-limiting.
- [ ] Swagger OpenAPI documentation at `/api/docs`.

### Phase 5: Authentication & Authorization
- [ ] JWT authentication: short-lived access tokens + rotating hashed refresh tokens.
- [ ] Password hashing with bcrypt.
- [ ] Student ID / University Email registration validation.
- [ ] Role-based access control middleware (`requireAuth`, `requireRole(['ADMIN', 'SECURITY_OFFICER'])`).
- [ ] Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/users/me`.

### Phase 6: Items & Evidence Management
- [ ] Item creation with multi-image support.
- [ ] Filtering (type, category, location, status, date range), sorting, search, pagination.
- [ ] Strict privacy: exclude `hiddenDetail` and private contact from public feeds.
- [ ] Status transition logic.
- [ ] Matching engine: auto-generate notifications on potential lost/found matches.

### Phase 7: Claims & Handover State Machine
- [ ] Claim submission with proof description, answers, and evidence photo.
- [ ] Conflict prevention and transaction isolation for simultaneous claims.
- [ ] Review workflow: Approve, Reject, Schedule Handover, Confirm Return.
- [ ] Status history recording for full auditability.

### Phase 8: Mobile Architecture & Design System
- [ ] Injibara University color palette (Deep University Blue `#0F2C59`, Teal `#008080`, Slate `#F5F7FA`, Gold accent).
- [ ] Reusable components: ItemCard, StatusBadge, CustomButton, FormInput, ImagePickerBox, EmptyState, ErrorState, OfflineBanner.
- [ ] Amharic and English localization dictionary structure.
- [ ] TanStack Query + Axios API client with secure token persistence via Expo SecureStore.

### Phase 9: Mobile Screen Implementation
- [ ] **Auth:** Welcome, Login, Register, Forgot Password.
- [ ] **Home:** Live item feed, campus category chips, stats overview.
- [ ] **Search & Filter:** Keyword search, lost/found tabs, location & category filters.
- [ ] **Report Item:** Step-by-step reporting with image picker, campus location picker, and hidden proof details.
- [ ] **Item Details:** High-res gallery, item specs, privacy-compliant reporter info, "Claim This Item" action.
- [ ] **Claim Form:** Ownership verification questionnaire and evidence upload.
- [ ] **My Activity:** Dual tabs for "My Reports" and "My Claims" with status progress tracker.
- [ ] **Notifications:** Interactive notifications with direct deep-links.
- [ ] **Profile & Settings:** User profile, language toggle, security settings, logout.
- [ ] **Admin Dashboard:** Claim review queue, item moderation, user management, and statistics.

### Phase 10: Testing, Verification & Documentation
- [ ] Backend unit & integration test suites (Jest + Supertest).
- [ ] Mobile unit tests (validation & components).
- [ ] Manual test case matrix (`docs/manual-test-cases.md`).
- [ ] API documentation (`docs/api-documentation.md`, Postman collection).
- [ ] Architecture and deployment guides (`docs/architecture.md`, `docs/deployment.md`).
- [ ] Build & verification execution.
