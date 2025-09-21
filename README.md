# Dashboard - Multi-Tenant Service Management Platform

## 🚀 Quick Start Guide

### Prerequisites

- Node.js 20+ 
- Docker Desktop (for PostgreSQL and Redis)
- pnpm (will be installed automatically)

### Installation Steps

1. **Install dependencies:**
```bash
npm install -g pnpm@9
pnpm install
```

2. **Start Docker services:**
```bash
docker-compose up -d
```

Wait a few seconds for services to start, then verify:
```bash
docker ps
```

You should see 3 containers running: postgres, redis, and mailhog.

3. **Set up the database:**
```bash
# Generate Prisma client
pnpm db:generate

# Create database tables
pnpm db:push

# Seed with demo data
pnpm db:seed
```

4. **Start the development server:**
```bash
pnpm dev
```

The application will be available at: **http://localhost:3000**

## 🔑 Demo Accounts

After seeding the database, you can login with:

- **Barbershop Owner:** 
  - Email: `owner@luxurycuts.com`
  - Password: `password123`

- **Nail Salon Owner:**
  - Email: `owner@glamournails.com`
  - Password: `password123`

## 📱 Features

- Multi-tenant architecture with subdomain support
- Online booking system
- Staff and service management
- Customer database
- Payment processing (Stripe)
- Email/SMS notifications
- Analytics dashboard
- Mobile-ready PWA

## 🛠 Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** tRPC, Prisma, PostgreSQL
- **Auth:** NextAuth.js
- **Payments:** Stripe
- **Notifications:** Resend (email), Twilio (SMS)

## 📦 Project Structure

```
dashboard-website/
├── apps/
│   └── web/           # Next.js application
├── packages/
│   ├── db/           # Database (Prisma)
│   ├── core/         # Business logic
│   ├── maps/         # Map providers
│   ├── ui/           # UI components
│   └── config/       # Shared configs
└── docker-compose.yml # Local services
```

## 🧪 Development

```bash
# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Database studio
pnpm db:studio
```

## 📧 Email Testing

View test emails at: http://localhost:8025 (Mailhog)

## 🔧 Troubleshooting

### Port already in use
Change the port:
```bash
PORT=3001 pnpm dev
```

### Database connection issues
Restart Docker services:
```bash
docker-compose restart
```

### Clear everything and start fresh
```bash
docker-compose down -v
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
docker-compose up -d
pnpm db:push
pnpm db:seed
```

## 📄 License

MIT

---

## Local env using the same cloud .env (Supabase + Upstash)

Use this path when you want your local app to point to the same remote services used in production (Supabase Postgres via pool, Upstash Redis, shared JWT/CLIENT/REFRESH secrets).

1) Copy your production secrets
- Root env: duplicate `.env.example` to `.env` and fill with your production values (do not commit).
- App env: ensure `apps/web/.env.local` exists; you can keep it minimal if the root `.env` already has the values.
- DB package env: update `packages/db/.env` to point Prisma to Supabase (use the pooled connection for `DATABASE_URL` and `DIRECT_URL`). Example placeholders:
  - `DATABASE_URL=postgresql://<user>:<pass>@<supabase-host>:6543/postgres?schema=public&pgbouncer=true`
  - `DIRECT_URL=postgresql://<user>:<pass>@<supabase-host>:5432/postgres?schema=public`

Required variables to mirror from production:
- Postgres: `DATABASE_URL`, `DIRECT_URL`
- Redis (Upstash): `REDIS_URL`
- Auth secrets: `JWT_SECRET`, `CLIENT_JWT_SECRET`, `REFRESH_SECRET`
- App URLs: `NEXTAUTH_URL`, `APP_BASE_URL`
- Email: either Gmail SMTP (`EMAIL_*`) or Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) depending on the path you use (see Email notes below)

2) Push schema and seed against Supabase
Run Prisma commands scoped to the DB package so they read `packages/db/.env`:
```bash
pnpm --filter @dashboard/db db:push
pnpm --filter @dashboard/db db:seed
```

Notes:
- The schema uses Postgres extensions `postgis` and `uuid-ossp`. Supabase supports both. If `db:push` warns, enable them from SQL:
  - `create extension if not exists postgis;`
  - `create extension if not exists "uuid-ossp";`
- `db:seed` creates demo tenants, businesses and owners. Admin user can be created with the helper script below.

3) Start the app locally (pointing to cloud services)
```bash
pnpm --filter @dashboard/web dev
```

---

## Email delivery (dev and remote)

Current implementation uses Nodemailer with two modes:
- Development (no Gmail configured): sends to local MailHog at `localhost:1025` and logs a hint to open http://localhost:8025
- Production/remote: uses SMTP credentials from `EMAIL_*`. The `resend` package is present but not wired yet.

Endpoints involved:
- `apps/web/app/api/auth/send-verification/route.ts` (owner register)
- `apps/web/app/api/cliente/auth/send-verification/route.ts` (client register)

Observability while testing:
- Terminal logs are JSON lines from `apps/web/lib/logger.ts`
- Dev helper to inspect the current code stored in Redis:
  - GET `/api/get-verification-code?email=<email>` (works in dev; in prod requires header `x-internal-key: $INTERNAL_API_KEY`)

To switch to Resend later:
- Provide `RESEND_API_KEY` and `RESEND_FROM_EMAIL` and replace `sendEmail(...)` in `apps/web/lib/email.ts` with a Resend client call. For now, SMTP/MailHog is the active path.

---

## Admin login (local validation)

Ensure the default admin exists and verify login in a browser before focusing on email flows:

1) Create/ensure admin user (email/password below):
```bash
node create-admin-user.js
```

2) Open http://localhost:3000/admin/login and use:
- Email: `admin@dashboard.com`
- Password: `password123`

If login succeeds you will be redirected to `/admin/dashboard` and an `admin-session` cookie is set server-side.
