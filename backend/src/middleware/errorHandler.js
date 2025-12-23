import logger from '../utils/logger.js';
import { formatError } from '../utils/errors.js';
import { markIdempotencyFailed } from './idempotency.js';

/**
 * Global error handler middleware
 * Must be registered last in middleware chain
 */
export function errorHandler(err, req, res, next) {
  // Log error
  logger.error(
    {
      err,
      traceId: req.traceId,
      path: req.path,
      method: req.method,
      body: req.body,
    },
    'Request error'
  );

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Format error response
  const errorResponse = formatError(err, req.traceId);

  // Mark idempotency as failed if applicable
  if (req.idempotencyKey && req.idempotencyRecord) {
    markIdempotencyFailed(req, errorResponse, statusCode).catch(idempErr => {
      logger.error({ err: idempErr, traceId: req.traceId }, 'Failed to mark idempotency as failed');
    });
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    traceId: req.traceId,
  });
}
