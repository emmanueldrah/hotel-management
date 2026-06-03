---
name: testing-hms
description: Test the Hotel Management System (HMS) end-to-end. Use when verifying HMS UI or API changes — reservations, billing, restaurant, inventory, audit logs, reports, settings.
---

# Testing the HMS app

## Stack & how to run locally
- Backend: Express + Prisma (PostgreSQL) on port **4000**, API prefix `/api/v1`. Frontend: Vite/React on port **3000** (CORS only allows `http://localhost:3000`).
- Postgres via Docker; DB URL `postgresql://hms:hms_password@localhost:5432/hms?schema=public`.
- Setup: start Postgres, then in `backend/` run `npx prisma migrate deploy` + `npm run seed` + `npm run dev`; in `frontend/` run `npm run dev`. Health check: `curl localhost:4000/health` and `curl localhost:3000`.
- Maximize the browser before recording: `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`.

## Demo accounts (all password `Password123`)
`superadmin@hms.com` (SUPER_ADMIN, wildcard — sees ALL nav), `owner@hms.com`, `receptionist@hms.com` (has branchId — use for reservation/billing flows), `housekeeping@hms.com`, `restaurant@hms.com`, `accountant@hms.com`, `maintenance@hms.com`. Login page has demo quick-fill buttons.

## Seed data facts (ground your assertions on these)
- 24 rooms across types (Standard $120 … Presidential $900). 3 guests incl. **John Doe** (VIP). 4 menu items incl. **Grilled Salmon $28**, **Continental Breakfast $18**.
- **No** reservations, inventory items, events, notifications, or restaurant orders are seeded — those pages show empty states on a fresh DB. To test their data-rendering/interactive paths you must create rows first (via UI where supported, or extend the seed).
- The DB persists between runs, so prior test reservations/payments may already be present (e.g. revenue is non-zero). Account for this rather than asserting absolute zeros.

## RBAC nav
- Super admin sees every nav item including Restaurant, Inventory, Events, Audit Logs, Notifications, Settings.
- Receptionist sees only Dashboard, Reservations, Rooms, Guests, Billing, Housekeeping, Reports, Notifications, Settings. Audit Logs requires owner/super admin. Use this difference itself as an RBAC assertion.

## Golden-path flow (also generates audit/report data)
Log in as **receptionist**: Dashboard (KPIs + 3 charts) → Reservations → New reservation (pick guest, dates, room) → row appears CONFIRMED → **Check in** (CHECKED IN) → **Check out** (CHECKED OUT, auto-creates invoice) → Billing → **Take payment** (invoice → PAID, balance $0) → Reports → **Export CSV** (downloads `hms-report.csv`; verify file contents match UI). Then log in as **super admin** to verify Restaurant menu prices, Audit Logs show the CREATE→CHECK_IN→CHECK_OUT→PAYMENT sequence, and Settings change-password (change then change back to keep `Password123` valid).

## Tips / gotchas
- Prisma `Decimal` serializes as a string in JSON; price/quantity comparisons use `Number(...)`. If a price renders as `$NaN`, that conversion may be broken.
- Restaurant order status advances `OPEN→PREPARING→SERVED→BILLED` via `PATCH /restaurant-orders/:id/status`; notifications mark read via `PATCH /notifications/:id/read` — these need seeded/created rows to exercise.
- Audit Logs is the most reliable end-to-end proof: it records real CREATE/CHECK_IN/CHECK_OUT/PAYMENT actions with user + timestamp + IP.

## Devin Secrets Needed
None — runs fully locally with the seeded demo accounts (password `Password123`). No external API keys required for the core flows.
