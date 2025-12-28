# Quick Start Guide

Get Numatix running in under 5 minutes.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Make (optional but recommended)

## Method 1: Using Make (Recommended)

```bash
# Complete first-time setup
make setup

# This will:
# 1. Install dependencies (backend + frontend)
# 2. Start Docker services (MongoDB, Redis)
# 3. Seed database with sample data
```

**Access the application**:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Method 2: Manual Setup

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### Step 2: Start Infrastructure

```bash
# From project root
docker-compose up -d mongodb redis
```

### Step 3: Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

### Step 4: Seed Database

```bash
cd backend
npm run seed
```

**Save the customer IDs** printed in the output - you'll need them for testing.

### Step 5: Start Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Verify Installation

### 1. Check Services

```bash
# Backend health
curl http://localhost:3000/api/health

# List plans
curl http://localhost:3000/api/plans | jq
```

### 2. Test UI

1. Open http://localhost:5173
2. You should see 4 plans with different capacities
3. Click "Purchase Now" on any plan
4. Complete the purchase
5. Verify capacity decreased

### 3. Run Concurrency Test (Critical!)

```bash
cd backend
npm run test:concurrency
```

**Expected output**:

```
✅ No Overselling: Subscriptions sold (10) ≤ Capacity (10)
✅ Database Integrity: Subscriptions left (0) ≥ 0
✅ Count Accuracy: subscriptions_left = total_capacity - active_subscriptions
✅ Correct Error Codes: Sold out errors (40) returned for excess requests

🎉 CONCURRENCY TEST PASSED! 🎉
```

## Common Commands

```bash
# View logs
make logs

# Restart services
make restart

# Stop services
make down

# Reset database
make reset

# Reseed database
make seed

# Run concurrency test
make test-concurrency
```

## Troubleshooting

### Port already in use

If ports 3000, 5173, 27017, or 6379 are occupied:

```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml and .env
```

### MongoDB connection failed

```bash
# Check MongoDB is running
docker ps | grep mongo

# View MongoDB logs
docker logs numatix-mongo

# Restart MongoDB
docker restart numatix-mongo
```

### Frontend can't connect to backend

1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check proxy in `frontend/vite.config.js`
3. Clear browser cache
4. Check browser console for errors

### Seed script fails

```bash
# Reset and try again
npm run reset
npm run seed

# Check MongoDB connection
docker exec -it numatix-mongo mongosh numatix
```

## Next Steps

1. **Read the docs**:

   - `README.md` - Project overview
   - `DEMO.md` - Demo script
   - `CHECKLIST.md` - Feature checklist
   - `ASSESSMENT_PREP.md` - Call preparation

2. **Explore the code**:

   - `backend/src/models/Plan.js` - Atomic seat reservation
   - `backend/src/services/subscriptionService.js` - Purchase logic
   - `backend/src/middleware/idempotency.js` - Duplicate protection

3. **Test scenarios**:
   - Purchase until sold out
   - Try duplicate request with same idempotency key
   - Check audit logs in MongoDB

## Development Workflow

### Making Changes

```bash
# Backend changes auto-reload (nodemon)
# Frontend changes auto-reload (Vite HMR)
```

### Testing Changes

```bash
# Run concurrency test after any changes to purchase logic
npm run test:concurrency

# Check logs for errors
make logs-backend
```

### Database Operations

```bash
# Access MongoDB shell
make shell-mongo

# Common queries
db.plans.find().pretty()
db.subscriptions.find().pretty()
db.auditlogs.find().sort({createdAt: -1}).limit(10)

# Verify capacity integrity
db.plans.aggregate([
  {
    $lookup: {
      from: 'subscriptions',
      localField: '_id',
      foreignField: 'planId',
      as: 'subs'
    }
  },
  {
    $project: {
      name: 1,
      total_capacity: 1,
      subscriptions_left: 1,
      active_count: {
        $size: {
          $filter: {
            input: '$subs',
            as: 'sub',
            cond: { $eq: ['$$sub.status', 'active'] }
          }
        }
      }
    }
  }
])
```

## API Examples

### Get Plans

```bash
curl http://localhost:3000/api/plans | jq
```

### Purchase Subscription

```bash
IDEMPOTENCY_KEY=$(uuidgen)
CUSTOMER_ID="<from seed output>"
PLAN_ID="<from plans response>"

curl -X POST http://localhost:3000/api/subscriptions/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d "{
    \"planId\": \"$PLAN_ID\",\n    \"customerId\": \"$CUSTOMER_ID\",\n    \"paymentMethodId\": \"pm_test_card\"\n  }" | jq
```

### Get Subscription

```bash
SUBSCRIPTION_ID="<from purchase response>"

curl http://localhost:3000/api/subscriptions/$SUBSCRIPTION_ID | jq
```

### Get Customer Subscriptions

```bash
curl "http://localhost:3000/api/customers/$CUSTOMER_ID/subscriptions?status=active" | jq
```

## Cleanup

```bash
# Stop services but keep data
make down

# Stop services and delete data
make clean

# Uninstall everything
docker-compose down -v
rm -rf backend/node_modules frontend/node_modules
```

## Production Deployment

For production deployment, see:

- `docker-compose.yml` - Update environment variables
- `backend/.env.example` - Configure production values
- `Dockerfile` in backend/frontend - Already production-ready

**Don't forget to**:

- Set strong JWT_SECRET
- Use real MongoDB connection string
- Configure Redis for session storage
- Set up monitoring and alerts
- Enable SSL/TLS
- Configure rate limiting

## Support

If you encounter issues:

1. Check logs: `make logs`
2. Verify services: `docker ps`
3. Check MongoDB: `make shell-mongo`
4. Review error traces in backend logs
5. Check browser console for frontend errors

---

**You're all set!** The system should be running with sample data. Visit http://localhost:5173 to start using the application.
