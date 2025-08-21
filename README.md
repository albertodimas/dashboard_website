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