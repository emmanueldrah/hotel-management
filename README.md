# HMS — Hotel Management System

An enterprise-grade, multi-property Hotel Management System for hotels, resorts, guest
houses, apartments and lodges. Built as a TypeScript monorepo with a Node/Express +
PostgreSQL (Prisma) API and a React + Tailwind single-page app.

> Single-property and multi-branch ready · JWT + refresh tokens · Role-Based Access Control ·
> Reservations, front desk, housekeeping, maintenance, billing, restaurant POS, inventory,
> staff, loyalty, reports and analytics.

---

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Query, React Hook Form, Chart.js |
| Backend      | Node.js 20, Express, TypeScript, Zod validation |
| Database     | PostgreSQL 16, Prisma ORM (migrations + seed) |
| Auth         | JWT access tokens + rotating refresh tokens, RBAC (7 roles) |
| Security     | helmet, CORS, rate limiting, bcrypt password hashing, input validation |
| DevOps       | Docker, Docker Compose, Nginx, GitHub Actions CI |

## Monorepo layout

```
.
├── backend/            # Express + Prisma REST API
│   ├── prisma/         # schema.prisma + seed.ts
│   └── src/
│       ├── config/     # env + prisma client
│       ├── middleware/ # auth, validation, error handling
│       ├── modules/    # auth, reservations, invoices, payments, housekeeping, ...
│       ├── rbac/       # permissions + role mapping
│       └── utils/      # billing, jwt, password, audit, crud factory
├── frontend/           # React + Vite SPA
│   └── src/
│       ├── components/ # Layout, ProtectedRoute, UI primitives
│       ├── pages/      # Login, Dashboard, Rooms, Reservations, ...
│       ├── lib/        # api client, queries, permissions
│       └── store/      # Redux slices (auth, theme)
├── docs/               # API.md, DEPLOYMENT.md
├── docker-compose.yml  # db + backend + frontend (Nginx)
└── .github/workflows/  # CI pipeline
```

## Quick start (Docker — recommended)

The fastest way to run the whole stack (Postgres + API + Nginx-served frontend):

```bash
cp .env.example .env          # adjust secrets if you like
docker compose up --build
```

- Frontend: http://localhost:8080
- API:      http://localhost:4000/api/v1
- The backend container runs migrations automatically and seeds demo data
  (`SEED_ON_START=true`).

## Quick start (local dev)

Prerequisites: Node 20+, a running PostgreSQL 16.

### 1. Backend

```bash
cd backend
cp ../.env.example .env        # set DATABASE_URL + JWT secrets
npm install
npx prisma migrate dev         # create schema
npm run seed                   # load demo data
npm run dev                    # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env           # VITE_API_URL=http://localhost:4000/api/v1
npm install
npm run dev                    # http://localhost:3000
```

## Demo accounts

All seeded users share the password **`Password123`**.

| Role            | Email                     | Highlights |
|-----------------|---------------------------|------------|
| Super Admin     | superadmin@hms.com        | Everything |
| Hotel Owner     | owner@hms.com             | Operations, staff, finances, analytics |
| Receptionist    | receptionist@hms.com      | Reservations, check-in/out, invoices, payments |
| Housekeeping    | housekeeping@hms.com      | Room cleaning status, maintenance reports |
| Restaurant Mgr  | restaurant@hms.com        | Menu, orders, restaurant billing |
| Accountant      | accountant@hms.com        | Finances, payments, reports |
| Maintenance     | maintenance@hms.com       | Maintenance tickets |

## Modules

Hotels & branches · Room types & rooms · Reservations (availability, walk-in, check-in,
check-out) · Guests, loyalty & VIP · Billing & invoicing (room/restaurant/service charges,
tax, discounts, split balances) · Payments (cash, card, mobile money, bank transfer) ·
Housekeeping · Maintenance · Restaurant / POS (menu, tables, orders, room-charge posting) ·
Inventory & suppliers · Staff / HR · Events · Notifications · Audit logs · Settings ·
Dashboard (KPIs, occupancy, revenue charts) · Reports & analytics.

## Roles & permissions

RBAC is enforced server-side (`backend/src/rbac/permissions.ts`) and mirrored in the UI for
nav/visibility. `SUPER_ADMIN` holds a wildcard (`*`); every other role is granted a least-
privilege subset. API guards (`authorize(...)`, `requireRole(...)`) reject unauthorized
requests with `401`/`403`.

## Testing & quality gates

```bash
# Backend
cd backend && npm run lint && npm run typecheck && npm run build && npm test

# Frontend
cd frontend && npm run lint && npm run typecheck && npm run build && npm test
```

CI (`.github/workflows/ci.yml`) runs all of the above for both packages on every push and PR.

## Documentation

- [API reference](docs/API.md) — endpoints, auth, request/response shapes, error format.
- [Deployment guide](docs/DEPLOYMENT.md) — Docker Compose, environment variables, production notes.
