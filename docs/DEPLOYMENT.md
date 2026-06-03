# Deployment guide

HMS ships as three services — PostgreSQL, the Express API, and an Nginx-served React build.
The included `docker-compose.yml` wires them together for a single-command deployment.

## 1. Prerequisites

- Docker Engine 24+ and Docker Compose v2
- (Local dev only) Node.js 20+ and PostgreSQL 16

## 2. Environment variables

Copy `.env.example` to `.env` and review. Compose reads it automatically.

| Variable | Default | Notes |
|----------|---------|-------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `hms` / `hms_password` / `hms` | Database credentials |
| `DATABASE_URL` | derived | Set automatically for the backend container |
| `JWT_ACCESS_SECRET` | `dev_access_secret_change_me` | **Change in production** |
| `JWT_REFRESH_SECRET` | `dev_refresh_secret_change_me` | **Change in production** |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `BCRYPT_SALT_ROUNDS` | `10` | Password hashing cost |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed browser origin |
| `SEED_ON_START` | `true` | Seed demo data on first backend boot |

> **Production:** always set strong, unique `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, set
> `SEED_ON_START=false` after the first run, and put the stack behind TLS (terminate HTTPS at
> a load balancer or an Nginx reverse proxy in front of `frontend`).

## 3. Run with Docker Compose

```bash
cp .env.example .env
docker compose up --build -d
docker compose logs -f backend     # watch migrations + seed
```

- Frontend (Nginx): http://localhost:8080
- API: http://localhost:4000/api/v1
- Nginx proxies `/api/*` to the backend, so the SPA talks to the API same-origin.

On startup the backend runs `prisma migrate deploy` and (when `SEED_ON_START=true`) seeds
roles, permissions, a demo hotel with two branches, one user per role, room types, rooms and
sample guests.

Tear down (keep data):
```bash
docker compose down
```
Tear down and wipe the database volume:
```bash
docker compose down -v
```

## 4. Build images individually

```bash
docker build -t hms-backend ./backend
docker build -t hms-frontend --build-arg VITE_API_URL=/api/v1 ./frontend
```

## 5. Database migrations

Migrations live in `backend/prisma/migrations` and are applied with `prisma migrate deploy`
(run automatically by the backend entrypoint). To create a new migration during development:

```bash
cd backend
npx prisma migrate dev --name <change>
```

## 6. CI/CD

`.github/workflows/ci.yml` runs lint, typecheck, build and tests for both the backend and
frontend on every push and pull request. Extend it with a deploy job (e.g. build & push
images to a registry, then `docker compose pull && up -d` on your host, or deploy to your
container platform of choice).

## 7. Production checklist

- [ ] Strong `JWT_*` secrets, rotated and stored in a secrets manager
- [ ] `SEED_ON_START=false` after first boot
- [ ] Managed PostgreSQL with automated backups (or a backed-up volume)
- [ ] HTTPS/TLS terminated in front of the frontend service
- [ ] `CORS_ORIGIN` locked to your real domain
- [ ] Centralised logging & monitoring on the backend container
- [ ] Rate-limit thresholds tuned for your traffic (`backend/src/config/env.ts`)
```
