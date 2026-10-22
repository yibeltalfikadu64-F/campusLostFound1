# Deployment & Infrastructure Guide: Injibara Campus Lost & Found

## 1. Local Development Deployment

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- PostgreSQL 16 (Local install, Docker container, or cloud-hosted instance like Supabase/Neon)

### Starting PostgreSQL with Docker Compose
```bash
docker compose up -d
```

### Initializing Database Migrations & Seeds
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Launching the Backend API
```bash
npm run dev:backend
# Starts at http://localhost:5000/api/v1
# Swagger docs at http://localhost:5000/api/docs
```

### Launching the Mobile App with Expo
```bash
npm run dev:mobile
```
Press `a` to launch on Android emulator, or scan the QR code with the Expo Go app on a physical Android phone connected to the same Wi-Fi network.

---

## 2. Production Backend Deployment
- Host on any Linux VPS (Ubuntu 22.04 LTS), container platform (Docker / Kubernetes), or cloud platform (Render, Railway, DigitalOcean).
- Set `NODE_ENV=production`.
- Use a secure connection pool URL for `DATABASE_URL` with SSL mode (`?sslmode=require`).
- Enforce HTTPS via Nginx or Cloudflare reverse proxy with valid TLS certificates.

---

## 3. Android Production APK & EAS Build

### Build Configuration (`mobile/eas.json`)
The project includes `eas.json` with pre-configured build profiles:
- `preview`: Generates a standalone Android `.apk` file for testing on physical devices without needing Expo Go.
- `production`: Generates an optimized `.aab` (Android App Bundle) ready for submission to the Google Play Store or university private app portal.

### Steps to Build Standalone Android APK
1. Install EAS CLI globally:
   ```bash
   npm.cmd install -g eas-cli
   ```
2. Log into your Expo account:
   ```bash
   eas login
   ```
3. Trigger the standalone Android APK build:
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```
4. Once completed, download the `.apk` file from the generated Expo link and install it directly onto any Android device.
