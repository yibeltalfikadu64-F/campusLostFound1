# Database Setup & Scripts: Injibara Campus Lost & Found

## 1. Quick Start with Docker
```bash
docker compose up -d
```
This initializes a PostgreSQL 16 Alpine container with database `campus_lost_found` listening on port 5432.

---

## 2. Prisma Migration & Seed
Run from the backend directory:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

---

## 3. Direct SQL Bootstrap
If configuring PostgreSQL manually without Prisma migrations, the raw schema can be initialized using `database/scripts/init.sql`.
