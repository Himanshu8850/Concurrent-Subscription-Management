# Frontend Application

React-based UI for the subscription management system.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client with idempotency support

## Development

```bash
npm install
npm run dev
```

Access at: http://localhost:5173

## Components

### PlansList

Displays all available subscription plans with:

- Real-time capacity indicators
- Sold out badges
- Low stock warnings
- Feature lists

### PurchaseModal

Handles subscription purchase flow:

- Plan confirmation
- Payment method selection (mock)
- Error handling with trace IDs
- Loading states

### SuccessModal

Shows purchase confirmation with:

- Subscription details
- Start/end dates
- Trace ID for debugging

## API Integration

The `src/services/api.js` module:

- Automatically generates idempotency keys
- Adds trace IDs to all requests
- Handles error responses
- Formats data for UI components

## Environment Variables

Create `.env` file:

```
VITE_API_URL=http://localhost:3000/api
```

## Building for Production

```bash
npm run build
npm run preview
```
