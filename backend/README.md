# Backend Service

## Structure

```
backend/
├── src/
│   ├── index.js          # Server entry point
│   ├── config/           # Configuration and environment
│   ├── models/           # Mongoose schemas
│   ├── services/         # Business logic layer
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Custom middleware (idempotency, tracing, errors)
│   └── utils/            # Helper functions
├── scripts/              # Database utilities and tests
│   ├── seed_db.js        # Populate initial data
│   ├── reset_db.js       # Clear database
│   └── concurrency_test.js  # Critical concurrency verification
├── tests/                # Test suites
└── package.json
```

## Key Responsibilities

### Models (`src/models/`)

- Define Mongoose schemas with validation
- Add indexes for query optimization
- Implement schema plugins for timestamps, soft deletes, etc.

### Services (`src/services/`)

- **subscriptionService.js**: Core business logic for seat reservation
- **paymentService.js**: Mock payment processing
- **idempotencyService.js**: Duplicate request handling
- **auditService.js**: Audit trail logging

### Middleware (`src/middleware/`)

- **idempotency.js**: Check and store idempotency keys
- **tracing.js**: Generate and propagate trace IDs
- **errorHandler.js**: Centralized error formatting
- **validator.js**: Request validation helpers

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update `MONGO_URI` with your MongoDB connection string
3. Configure other variables as needed

## Running Locally

```bash
npm install
npm run dev
```

## Database Operations

```bash
# Seed initial data
npm run seed

# Reset database
npm run reset
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Critical: Run concurrency test
npm run test:concurrency
```

## API Endpoints

See `openapi.yaml` in project root for complete API specification.

### Core Endpoints

- `GET /api/plans` - List available plans
- `GET /api/plans/:id` - Get plan details
- `POST /api/subscriptions/purchase` - Purchase subscription (requires Idempotency-Key)
- `GET /api/subscriptions/:id` - Get subscription details
- `GET /api/customers/:id/subscriptions` - List customer subscriptions

## Extension Points

### Adding New Plan Types

1. Update `Plan` model schema if needed
2. Add validation rules in `routes/plans.js`
3. Update seed script with new plan data

### Implementing Real Payments

1. Replace mock in `services/paymentService.js`
2. Add Stripe SDK initialization
3. Implement webhook handlers for async payment events

### Adding Distributed Locks

1. Uncomment Redis client in `src/config/redis.js`
2. Implement lock acquisition in `services/subscriptionService.js`
3. Add lock release in transaction rollback
