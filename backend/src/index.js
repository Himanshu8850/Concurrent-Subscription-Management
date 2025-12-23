import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import { tracingMiddleware } from './middleware/tracing.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
await connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },
  })
);

// Custom middleware
app.use(tracingMiddleware);
app.use(idempotencyMiddleware);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'cstl-stripe-clone Subscription Management API',
    version: '1.0.0',
    docs: '/api-docs',
  });
});

app.use('/api', routes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started successfully');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

export default app;
