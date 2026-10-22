# System Architecture: Injibara Campus Lost & Found

## 1. Overview
The **Injibara Campus Lost & Found** system is an enterprise full-stack platform engineered to streamline the recovery and handover of misplaced personal items across the Injibara University campus. The system provides an Android mobile client, a Node.js/Express REST API backend, and a PostgreSQL database orchestrated via Prisma ORM.

```
┌────────────────────────────────────────────────────────┐
│                   React Native Client                  │
│       (Expo Router • TanStack Query • SecureStore)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Node.js / Express API Backend              │
│  ├── Helmet, CORS, Rate Limiters                       │
│  ├── Auth & RBAC Middleware                            │
│  ├── Input Validation (Zod)                            │
│  ├── Business Services (Items, Claims, Notifications)  │
│  └── Centralized Error Handling                        │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma ORM
                            ▼
┌────────────────────────────────────────────────────────┐
│               PostgreSQL Database                      │
│   (Users, Items, Claims, StatusHistories, Audits)      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Layers

### 2.1 Mobile Application (`mobile/`)
- **Framework:** React Native with Expo SDK 51.
- **Routing:** Expo Router file-based filesystem routing (`app/`).
- **State & Caching:** `@tanstack/react-query` for server state, automated retries, and cache invalidation.
- **Security:** `expo-secure-store` keeps access tokens and rotating refresh tokens encrypted on device hardware keychain/keystore.
- **Media & Hardware:** `expo-image-picker` with compression via `expo-image-manipulator` restricts uploads to max 3 compressed JPEG photos. `expo-location` facilitates campus coordinate tagging.
- **Localization:** Persistent English and Amharic dictionaries with runtime toggle.

### 2.2 Backend API (`backend/`)
- **Runtime:** Node.js with TypeScript (`target: ES2022`).
- **Architecture:** Layered Service-Oriented Architecture (Routes → Middleware → Controllers → Services → Prisma).
- **Security Middleware:**
  - `helmet`: Strict HTTP headers (Content-Security-Policy, X-Frame-Options).
  - `cors`: Explicit origin configuration.
  - `rate-limit`: Brute-force protection on authentication and upload endpoints.
  - `auth`: Extraction, signature verification, and DB status check of JWT tokens.
- **Central Error Handling:** Strict error envelopes without leaking database errors or stack traces to clients.

### 2.3 Database Layer (`backend/prisma/`)
- **RDBMS:** PostgreSQL 16.
- **Access:** Prisma Client with typed queries, relations, and transactional rollbacks (`$transaction`).
- **Idempotency:** Re-runnable database seeds with `upsert` semantics for categories, locations, and bootstrap security accounts.

---

## 3. Data & Communication Flow
1. **Reporting Flow:** User snaps or selects photos → client compresses to <=1024px → uploads multipart to `/api/v1/items/upload` → submits report JSON to `/api/v1/items` → backend validates coordinates, category, and dateEvent → saves Item, ItemImages, and creates initial StatusHistory.
2. **Matching Flow:** Upon creating an item, `matchingService` runs asynchronously, extracting normalized keywords from title, brand, and color → queries active counter-reports (LOST vs FOUND) within the same category → creates in-app notifications for both reporters.
3. **Claim & Review Flow:** Claimant submits ownership claim with private answers and photo proof → item status transitions to `CLAIM_PENDING` → Campus security officer evaluates evidence in Admin Portal → Approves or rejects → Handover is scheduled with physical location and date → Item is verified returned, marking item and claim as `RETURNED`.
