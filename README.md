# Hotel Management System

A complete Hotel Management System built with React (TypeScript), FastAPI (Python), and PostgreSQL.

## Features

- **Authentication & Access Control**: JWT with Refresh Tokens, Role-based access (Admin, Manager, Receptionist).
- **Room Management**: CRUD rooms, availability calendar, status filters, amenities.
- **Reservations**: Booking flow, availability check, check-in/out transitions.
- **Guest Management**: Guest profiles, VIP/Blacklist flagging, stay history.
- **Billing & Invoicing**: Auto-invoice generation, extra charges, PDF downloads.
- **Housekeeping**: Task tracking, room status updates, priority flags.
- **Staff Management**: User accounts, departments, activity logging.
- **Dashboard & Reports**: Real-time stats, revenue charts, occupancy trends.
- **Dark/Light Mode**: User preference saved.
- **Responsive Design**: Works on Desktop, Tablet, and Laptop.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, TanStack Query, Lucide-React, Recharts.
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Alembic, ReportLab.
- **DevOps**: Docker, Docker Compose.

## Setup Instructions

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine.

### Installation
1. Clone the repository.
2. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Start the system:
   ```bash
   docker-compose up --build
   ```
4. The application will be available at:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Default Credentials
- **Admin**: `admin@hotel.com` / `password123`
- **Manager**: `manager@hotel.com` / `password123`
- **Receptionist**: `receptionist1@hotel.com` / `password123`

## Project Structure
- `/frontend`: React application.
- `/backend`: FastAPI application.
- `docker-compose.yml`: Connection orchestration.

## License
MIT
