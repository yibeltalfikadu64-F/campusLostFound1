# Injibara University Campus Lost & Found 🎓🔍

A full-stack, Android-first institutional lost and found application built for Injibara University students, staff, and campus security officers.

---

## 🌟 Key Features

### For Students & Campus Community
- **Secure Authentication:** Register and log in using either your official Injibara University email or Student/Staff ID (e.g. `UGR/14022/14`).
- **Report Lost & Found Items:** Step-by-step reporting with campus locations (Main Gate, Central Library, Cafeteria, Dormitories, Sports Complex), photo compression, and categorizing.
- **Secret Verification Clues:** When reporting found items, finders record private clues (e.g. lockscreen wallpaper, stickers, serial numbers) hidden from public view to prevent fraudulent claims.
- **Smart Item Matching:** Deterministic keyword and category matching notifies reporters of potential lost/found counter-matches automatically.
- **Evidence-Based Ownership Claims:** Submit claims with descriptive proof, answers to secret clues, and photo receipts.
- **Real-Time Campus Alerts:** In-app notifications when claims are filed, approved, or scheduled for physical collection.
- **Bilingual Interface:** Instant runtime toggle between English and Amharic (አማርኛ) with full dictionary coverage.
- **Offline Resilience:** Auto-detects network disconnections, presents clear alerts, and serves cached campus feeds without crashing.

### For Campus Security Administrators
- **Real-Time Recovery Dashboard:** Live metrics calculated directly from the PostgreSQL database (total items, recovery rate %, pending claims, active users).
- **Claims Verification Queue:** Review submitted ownership evidence, inspect claimant contact details, and approve or reject claims.
- **Scheduled Physical Handovers:** Assign collection locations (e.g. Security Office #104) and pickup times, with student ID verification upon handover.
- **Campus Management:** Administer official campus building locations and item categories.
- **Audit Logging:** Every status change and administrative intervention is recorded with actor ID and timestamp for auditability.

---

## 🏗️ System Architecture

```
campus-lost-found/
├── mobile/                 # React Native / Expo Mobile App
│   ├── app/                # Expo Router file-based screens
│   ├── src/                # Theme, i18n, components, API client
│   ├── app.config.ts       # Android permissions & config
│   └── eas.json            # EAS standalone APK & App Bundle profiles
├── backend/                # Express TypeScript REST API
│   ├── src/                # Layered: Routes -> Controllers -> Services -> Prisma
│   ├── prisma/             # Schema, migrations, idempotent seed
│   └── tests/              # Jest & Supertest integration suites
├── database/               # SQL setup scripts & docs
├── docs/                   # Complete architecture, database & API documentation
├── postman/                # Complete Postman API collection
├── docker-compose.yml      # Local PostgreSQL container configuration
└── package.json            # Monorepo root orchestration scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** >= 20.x (`v24.21.0` supported)
- **npm:** >= 10.x
- **PostgreSQL 16:** Local server, Docker container, or cloud database (Neon, Supabase).
- **Expo Go App:** On an Android phone, or Android Studio Emulator.

---

### 2. Environment Configuration
Copy the template files:
```bash
# Root & backend environment
cp .env.example .env
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env
```

Key environment variables in `backend/.env`:
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/campus_lost_found?schema=public`).
- `PORT`: 5000.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Secure encryption keys.
- `ADMIN_BOOTSTRAP_EMAIL` & `ADMIN_BOOTSTRAP_PASSWORD`: Initial admin credentials.

Key environment variable in `mobile/.env`:
- `EXPO_PUBLIC_API_URL`: Use `http://10.0.2.2:5000/api/v1` for Android emulator, or your computer's local Wi-Fi IP (e.g., `http://192.168.1.50:5000/api/v1`) for physical devices.

---

### 3. Database Initialization

#### Option A: Using Docker Compose
```bash
docker compose up -d
```

#### Option B: Using an existing PostgreSQL server
Set your `DATABASE_URL` in `backend/.env`.

#### Generate Prisma Client & Run Seed
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```
*The idempotent seed populates official Injibara University campus locations, 10 item categories, an administrator (`admin@injibara.edu.et`), a security officer (`security@injibara.edu.et`), and demonstration items.*

---

### 4. Running the Development Servers

#### Run Backend API:
```bash
npm run dev:backend
```
- API Endpoint: `http://localhost:5000/api/v1`
- Health Endpoint: `http://localhost:5000/api/v1/health`
- Interactive Swagger UI: `http://localhost:5000/api/docs`

#### Run Mobile Application:
```bash
npm run dev:mobile
```
- Press `a` in the terminal to launch on your connected Android emulator.
- Or scan the QR code with **Expo Go** on a physical Android device connected to the same Wi-Fi.

#### Run Both Concurrently:
```bash
npm run dev:all
```

---

## 🧪 Automated Testing & Verification

```bash
# Run backend integration & security tests
npm --workspace=backend run test

# Run mobile validation unit tests
npm --workspace=mobile run test

# Run TypeScript typechecks across both projects
npm run typecheck
```

---

## 📱 Building Standalone Android APK

To generate a standalone `.apk` for distribution to students without Expo Go:

1. Install EAS CLI:
   ```bash
   npm.cmd install -g eas-cli
   ```
2. Build standalone APK via EAS:
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```
3. Download the compiled `.apk` file from the Expo dashboard link.

---

## 🛡️ Security & Privacy Architecture
1. **Password Hashing:** Passwords hashed using bcrypt with salt rounds of 10.
2. **Rotating Refresh Tokens:** Single-use refresh tokens stored as SHA-256 hashes in the database with revocation on logout or password change.
3. **Role-Based Access Control (RBAC):** Privileged actions (claim approvals, user status updates, campus locations) strictly require `ADMIN` or `SECURITY_OFFICER` roles.
4. **Ownership Evidence Shield:** Secret verification clues (`hiddenDetail`) are never exposed through public search endpoints or public item details.
5. **Rate Limiting:** Auth endpoints are throttled to prevent brute-force attacks.

---

## 📚 Complete Documentation Index
- [Architecture Guide](docs/architecture.md)
- [Database Design](docs/database-design.md)
- [Mermaid ER Diagram](docs/er-diagram.md)
- [API Documentation](docs/api-documentation.md)
- [Testing Plan](docs/testing-plan.md)
- [Manual Test Cases](docs/manual-test-cases.md)
- [Bug & Quality Log](docs/bug-log.md)
- [Deployment & EAS Guide](docs/deployment.md)
- [User Manual](docs/user-manual.md)
- [Privacy Policy](docs/privacy.md)
- [Project Status](docs/project-status.md)
- [Postman Collection](postman/campus-lost-found.postman_collection.json)

---

## 🏛️ Injibara University
*Campus Security & Student Services Division • Injibara, Ethiopia*
