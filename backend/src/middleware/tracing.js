import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to generate or extract trace ID for request tracking
 */
export function tracingMiddleware(req, res, next) {
  // Check if trace ID exists in header, otherwise generate new one
  const traceId = req.headers['x-trace-id'] || uuidv4();

  req.traceId = traceId;

  // Add trace ID to response headers
  res.setHeader('X-Trace-Id', traceId);

  // Attach to logger context if using structured logging
  req.log = req.log.child({ traceId });

  next();
}
