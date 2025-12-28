cstl-stripe-clone is my personal project exploring how to build a resilient, Stripe‑like subscription system. It focuses on solving overselling, retries, and transactional consistency when many customers purchase limited‑capacity plans at the same time.

## Overview

- Prevents overselling with atomic capacity updates
- Guarantees request idempotency to avoid double charges on retries
- Uses MongoDB transactions to keep data consistent end‑to‑end
- Captures detailed audit logs for reconciliation and debugging

## Tech Stack

- Backend: Node.js, Express, Mongoose
- Database: MongoDB (replica set for transactions)
- Cache: Redis (idempotency and background processing)
- Frontend: React + Vite + Tailwind
- Ops: Docker Compose, Makefile

## Project Structure

```
cstl-stripe-clone/
├── backend/          # API server, models, services, routes
├── frontend/         # React app (admin + customer views)
├── docs/             # Design notes, scaling, workflows
├── openapi.yaml      # HTTP API spec
├── docker-compose.yml
├── start-dev.sh      # One-command local dev bootstrap
└── README.md
```

## Getting Started

### Option A: One‑command local dev

This starts MongoDB (via Docker), initializes the replica set, starts local Redis, seeds data, runs backend and frontend.

```bash
# From repo root
./start-dev.sh
```

Frontend opens on http://localhost:5173. Backend runs on http://localhost:3000.

### Option B: Full stack via Docker Compose

Runs MongoDB, Redis, backend, and frontend in containers for a consistent environment.

```bash
# From repo root
docker compose up -d

# View logs (optional)
docker compose logs -f backend
docker compose logs -f frontend
```

Stop everything:

```bash
docker compose down
```

### Manual setup (if you prefer)

```bash
# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Seed sample data
cd backend && npm run seed && cd ..

# Start backend
cd backend && npm run dev

# Start frontend (separate terminal)
cd frontend && npm run dev:frontend
```

## Environment

- MongoDB must run as a replica set for transactions. The `start-dev.sh` script auto‑initiates `rs0`.
- Docker Compose sets sane defaults for `MONGO_URI`, `REDIS_URL`, and `VITE_API_URL`.
- You can override settings via `.env` files in [backend](backend) and [frontend](frontend).

## Features in Detail

- Atomic seat reservation using a single `findOneAndUpdate` with capacity guard
- RFC‑style idempotency keys to deduplicate retried requests
- Transactional purchase flow: reserve → create subscription → log → commit/rollback
- Structured logging with request tracing and complete audit trails

## API

- Spec is documented in [openapi.yaml](openapi.yaml).
- Example endpoints:
  - `GET /api/plans` — list available plans
  - `POST /api/subscriptions/purchase` — purchase with `Idempotency-Key` header

## Useful Scripts

- Backend: `npm run dev`, `npm run seed`, `npm run test:concurrency`
- Frontend: `npm run dev` (runs `start-dev.sh`) or `npm run dev:frontend`
- Repo root: [start-dev.sh](start-dev.sh) for one‑shot setup

## Concurrency Test

The backend includes a stress test that sends many parallel purchase requests and verifies there is no overselling:

```bash
cd backend
npm run test:concurrency
```

## Why I built this

I wanted a hands‑on, end‑to‑end reference for building subscription flows that stay correct under real‑world failure modes: retries, race conditions, and partial failures.

## Documentation

Deeper design notes, scaling considerations, and workflows live in [docs](docs). Start with [QUICKSTART.md](QUICKSTART.md) and [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md).

## License

MIT

cstl-stripe-clone is my personal project exploring how to build a resilient, Stripe‑like subscription system. It focuses on solving overselling, retries, and transactional consistency when many customers purchase limited‑capacity plans at the same time.

## Overview

- Prevents overselling with atomic capacity updates
- Guarantees request idempotency to avoid double charges on retries
- Uses MongoDB transactions to keep data consistent end‑to‑end
- Captures detailed audit logs for reconciliation and debugging

## Tech Stack

- Backend: Node.js, Express, Mongoose
- Database: MongoDB (replica set for transactions)
- Cache: Redis (idempotency and background processing)
- Frontend: React + Vite + Tailwind
- Ops: Docker Compose, Makefile

## Project Structure

```
cstl-stripe-clone/
├── backend/          # API server, models, services, routes
├── frontend/         # React app (admin + customer views)
├── docs/             # Design notes, scaling, workflows
├── openapi.yaml      # HTTP API spec
├── docker-compose.yml
├── start-dev.sh      # One-command local dev bootstrap
└── README.md
```

## Getting Started

### Option A: One‑command local dev

This starts MongoDB (via Docker), initializes the replica set, starts local Redis, seeds data, runs backend and frontend.

```bash
# From repo root
./start-dev.sh
```

Frontend opens on http://localhost:5173. Backend runs on http://localhost:3000.

### Option B: Full stack via Docker Compose

Runs MongoDB, Redis, backend, and frontend in containers for a consistent environment.

```bash
# From repo root
docker compose up -d

# View logs (optional)
docker compose logs -f backend
docker compose logs -f frontend
```

Stop everything:

```bash
docker compose down
```

### Manual setup (if you prefer)

```bash
# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Seed sample data
cd backend && npm run seed && cd ..

# Start backend
cd backend && npm run dev

# Start frontend (separate terminal)
cd frontend && npm run dev:frontend
```

## Environment

- MongoDB must run as a replica set for transactions. The `start-dev.sh` script auto‑initiates `rs0`.
- Docker Compose sets sane defaults for `MONGO_URI`, `REDIS_URL`, and `VITE_API_URL`.
- You can override settings via `.env` files in [backend](backend) and [frontend](frontend).

## Features in Detail

- Atomic seat reservation using a single `findOneAndUpdate` with capacity guard
- RFC‑style idempotency keys to deduplicate retried requests
- Transactional purchase flow: reserve → create subscription → log → commit/rollback
- Structured logging with request tracing and complete audit trails

## API

- Spec is documented in [openapi.yaml](openapi.yaml).
- Example endpoints:
  - `GET /api/plans` — list available plans
  - `POST /api/subscriptions/purchase` — purchase with `Idempotency-Key` header

## Useful Scripts

- Backend: `npm run dev`, `npm run seed`, `npm run test:concurrency`
- Frontend: `npm run dev` (runs `start-dev.sh`) or `npm run dev:frontend`
- Repo root: [start-dev.sh](start-dev.sh) for one‑shot setup

## Concurrency Test

The backend includes a stress test that sends many parallel purchase requests and verifies there is no overselling:

```bash
cd backend
npm run test:concurrency
```

## Why I built this

I wanted a hands‑on, end‑to‑end reference for building subscription flows that stay correct under real‑world failure modes: retries, race conditions, and partial failures.

## Documentation

Deeper design notes, scaling considerations, and workflows live in [docs](docs). Start with [QUICKSTART.md](QUICKSTART.md) and [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md).

## License

MIT
