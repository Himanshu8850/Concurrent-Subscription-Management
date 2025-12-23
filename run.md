# Run & Verify Guide

This guide shows how to run the app (backend + frontend) and verify atomic seat reservation, idempotency, and data integrity.

## Prerequisites

- Linux with bash
- Node.js 18+ and npm
- MongoDB 7+ (replica set required for transactions)
- Optional: Docker Compose (recommended for MongoDB)

## 1) Install dependencies

```bash
# From project root
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## 2) Start MongoDB (choose one)

### Option A: Docker Compose (recommended)

```bash
# From project root
# Starts MongoDB service
docker compose up -d mongodb

# Initialize replica set once after first start
mongosh --eval "rs.initiate()"
```

### Option B: Local mongod

```bash
mkdir -p /tmp/mongodb/data
mongod --dbpath /tmp/mongodb/data --logpath /tmp/mongodb/mongod.log --replSet rs0 --fork
mongosh --eval "rs.initiate()"
```

## 3) Configure environment (if needed)

- Backend: `backend/.env`
  - Example: `MONGODB_URI=mongodb://localhost:27017/cstl-stripe-clone?replicaSet=rs0`
  - Example: `PORT=3000`
- Frontend: `frontend/.env`
  - Example: `VITE_API_BASE=http://localhost:3000`

## 4) Seed sample data

```bash
# From project root
cd backend
npm run seed
```

## 5) Start services

```bash
# Backend
cd backend
node src/index.js > /tmp/backend.log 2>&1 &

# Frontend (in a second terminal)
cd frontend
npm run dev
```

## 6) Verify health

```bash
# Backend health
curl -s http://localhost:3000/api/health | jq '.'

# Plans overview
curl -s http://localhost:3000/api/plans | jq '.plans[] | {name, capacity: .total_capacity, available: .subscriptions_left}'

# Customers (to get a customerId)
curl -s http://localhost:3000/api/customers | jq '.customers[] | {name, _id}'
```

## 7) Make a purchase (atomic seats + idempotency)

```bash
# Select IDs
PLAN_ID=$(curl -s http://localhost:3000/api/plans | jq -r '.plans[0]._id')
CUSTOMER_ID=$(curl -s http://localhost:3000/api/customers | jq -r '.customers[0]._id')
IDEMPOTENCY_KEY=$(node -e "console.log(require('crypto').randomUUID())")

# First purchase (should succeed)
curl -s -X POST http://localhost:3000/api/subscriptions/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d "{\"planId\": \"$PLAN_ID\", \"customerId\": \"$CUSTOMER_ID\", \"paymentMethodId\": \"pm_test_card\"}" | jq '.'

# Send the exact same request again (idempotency: same response, no double charge)
curl -s -X POST http://localhost:3000/api/subscriptions/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d "{\"planId\": \"$PLAN_ID\", \"customerId\": \"$CUSTOMER_ID\", \"paymentMethodId\": \"pm_test_card\"}" | jq '.'
```

## 8) Verify capacity and DB integrity

```bash
# Capacity reflects purchases
curl -s http://localhost:3000/api/plans | jq ".plans[] | {name, total: .total_capacity, available: .subscriptions_left, used: (.total_capacity - .subscriptions_left)}"

# Database check via mongosh
mongosh --eval "\nconst db = db.getSiblingDB('cstl-stripe-clone');\nconst starter = db.plans.findOne({name: 'Starter Plan'});\nconst activeCount = db.subscriptions.countDocuments({planId: starter._id, status: 'active'});\nconsole.log('Active subscriptions:', activeCount);\nconsole.log('Capacity used matches:', starter.total_capacity - activeCount === (starter.total_capacity - starter.subscriptions_left));\n"
```

## 9) Concurrency test (optional)

```bash
# From backend
cd backend
npm run test:concurrency
```

Expected: No overselling even under 50 parallel requests. Some transient MongoDB write-conflict errors can appear on single-node replica sets; retry logic handles typical cases.

## 10) Logs & troubleshooting

```bash
# Backend logs
tail -100 /tmp/backend.log

# Common fixes
# - Ensure replica set is initiated: mongosh --eval "rs.initiate()"
# - Verify MONGODB_URI includes ?replicaSet=rs0
# - If Idempotency-Key error: use a proper UUIDv4 (see Node crypto.randomUUID)
```

## 11) Stop services

```bash
# Backend
pkill -f "node src/index.js"

# Frontend (Ctrl+C in the dev terminal)

# MongoDB via Docker Compose
docker compose down

# Local mongod (if you used local)
mongosh --eval "db.getSiblingDB('admin').shutdownServer()" || true
```

## Notes

- All write operations require a valid `Idempotency-Key` header.
- Atomic seat reservation uses a filter on `subscriptions_left > 0` with a single `findOneAndUpdate`.
- Transactions require a MongoDB replica set. Ensure it is initialized.
