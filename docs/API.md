# HMS REST API

Base URL: `/api/v1` (e.g. `http://localhost:4000/api/v1`).

All responses use a consistent envelope:

```jsonc
// success
{ "success": true, "data": <payload>, "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }

// error
{ "success": false, "message": "Human readable message", "details": { "fieldErrors": { "email": ["Invalid email"] } } }
```

## Authentication

JWT bearer auth. Obtain tokens via `POST /auth/login`, then send
`Authorization: Bearer <accessToken>` on protected requests. Access tokens expire in 15m;
use `POST /auth/refresh` with a refresh token (rotated on every use) to get a new pair.

### `POST /auth/login`

Request:
```json
{ "email": "receptionist@hms.com", "password": "Password123" }
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "user": { "id": "…", "name": "Front Desk", "email": "receptionist@hms.com", "role": "RECEPTIONIST" },
    "accessToken": "eyJhbGci…",
    "refreshToken": "eyJhbGci…"
  }
}
```

### Other auth endpoints

| Method | Path                     | Description |
|--------|--------------------------|-------------|
| POST   | `/auth/register`         | Create a user (admin-gated in production) |
| POST   | `/auth/refresh`          | Exchange a refresh token for a new token pair |
| POST   | `/auth/logout`           | Revoke the current refresh token |
| GET    | `/auth/me`               | Current authenticated user |
| POST   | `/auth/forgot-password`  | Begin password reset |
| POST   | `/auth/reset-password`   | Complete password reset |
| POST   | `/auth/change-password`  | Change password (authenticated) |

## Core resources

Standard CRUD resources support `GET /` (paginated, `?page=&limit=&q=` plus resource
filters), `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, each guarded by the relevant
permission.

| Resource           | Path                  | Read perm        | Write perm |
|--------------------|-----------------------|------------------|------------|
| Hotels             | `/hotels`             | `hotels:read`    | `hotels:write` |
| Branches           | `/branches`           | `hotels:read`    | `hotels:write` |
| Room types         | `/room-types`         | `rooms:read`     | `rooms:write` |
| Rooms              | `/rooms`              | `rooms:read`     | `rooms:write` |
| Guests             | `/guests`             | `guests:read`    | `guests:write` |
| Suppliers          | `/suppliers`          | `inventory:read` | `inventory:write` |
| Inventory items    | `/inventory`          | `inventory:read` | `inventory:write` |
| Menu items         | `/menu-items`         | `restaurant:read`| `restaurant:write` |
| Restaurant tables  | `/restaurant-tables`  | `restaurant:read`| `restaurant:write` |
| Events             | `/events`             | `events:read`    | `events:write` |
| Staff              | `/staff`              | `staff:read`     | `staff:write` |

## Reservations

| Method | Path                              | Description |
|--------|-----------------------------------|-------------|
| GET    | `/reservations/availability`      | Free rooms for a date window (`?checkIn=&checkOut=&roomTypeId=`) |
| GET    | `/reservations`                   | List reservations |
| GET    | `/reservations/:id`               | Reservation detail |
| POST   | `/reservations`                   | Create reservation (guest + rooms + dates) |
| PATCH  | `/reservations/:id/status`        | Update status (confirm, cancel, no-show) |
| POST   | `/reservations/:id/check-in`      | Check in → rooms `OCCUPIED` |
| POST   | `/reservations/:id/check-out`     | Check out → rooms `CLEANING`, housekeeping queued, invoice auto-generated |

Create request:
```json
{
  "guestId": "…",
  "roomIds": ["…", "…"],
  "checkInDate": "2026-06-10",
  "checkOutDate": "2026-06-12",
  "numberOfGuests": 2,
  "specialRequests": "High floor, late check-in"
}
```

## Billing, invoices & payments

| Method | Path                       | Description |
|--------|----------------------------|-------------|
| GET    | `/invoices`                | List invoices |
| GET    | `/invoices/:id`            | Invoice with line items + payments |
| POST   | `/invoices`                | Create draft invoice |
| POST   | `/invoices/:id/items`      | Add a line item (recomputes totals) |
| DELETE | `/invoices/:id/items/:itemId` | Remove a line item |
| POST   | `/invoices/:id/issue`      | Issue a draft invoice |
| POST   | `/payments`                | Record a payment (recomputes invoice balance/status) |
| POST   | `/payments/:id/refund`     | Refund a payment |
| GET    | `/payments`                | List payments |

Payment request:
```json
{ "invoiceId": "…", "amount": 240.00, "method": "CARD" }
```

## Operations

| Method | Path                              | Description |
|--------|-----------------------------------|-------------|
| GET/POST/PATCH | `/housekeeping`           | Cleaning tasks; `CLEAN`/`INSPECTED` frees the room |
| GET/POST/PATCH | `/maintenance`            | Repair tickets; `COMPLETED` sets `resolvedAt` |
| GET/POST/PATCH | `/restaurant-orders`      | POS orders; `POST /:id/post-to-room` posts charges to a reservation invoice |
| GET    | `/notifications`                  | List own notifications; `PATCH /:id/read` |
| GET    | `/audit-logs`                     | Read-only activity log (admin) |
| GET/POST | `/loyalty`                      | Loyalty transactions; award points |

## Dashboard & reports

| Method | Path                          | Description |
|--------|-------------------------------|-------------|
| GET    | `/dashboard/stats`            | Occupancy rate, rooms available/occupied, today's check-ins/outs, revenue today/month, pending payments, open maintenance, dirty rooms, active reservations |
| GET    | `/dashboard/revenue-trend`    | Daily revenue series (`?days=30`) |
| GET    | `/dashboard/occupancy-by-type`| Room counts grouped by status |
| GET    | `/reports/revenue`            | Revenue totals by payment method |
| GET    | `/reports/reservations`       | Reservation counts by status |
| GET    | `/reports/occupancy`          | Occupancy summary |
| GET    | `/reports/guests`             | Guest counts by loyalty tier + VIP |
| GET    | `/reports/inventory`          | Inventory levels / low-stock |

## Validation & errors

Request bodies, query params and route params are validated with Zod. Validation failures
return `400` with a `details.fieldErrors` map. Other common codes: `401` (missing/invalid
token), `403` (insufficient permission), `404` (not found), `409` (conflict, e.g. duplicate
unique key), `429` (rate limited), `500` (unexpected). Prisma errors are mapped
(`P2002`→`409`, `P2025`→`404`, `P2000`→`400`).
