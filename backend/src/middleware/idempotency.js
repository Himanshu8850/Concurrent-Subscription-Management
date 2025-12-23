import idempotencyService from '../services/idempotencyService.js';
import { AppError } from '../utils/errors.js';

/**
 * Middleware to handle idempotency for mutation operations
 * Requires Idempotency-Key header for POST/PUT/PATCH requests
 */
export async function idempotencyMiddleware(req, res, next) {
  // Only apply to mutation operations
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutationMethods.includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];

  // Require idempotency key for purchases
  if (req.path.includes('/purchase') && !idempotencyKey) {
    return next(new AppError('Idempotency-Key header is required', 400, 'MISSING_IDEMPOTENCY_KEY'));
  }

  // If no idempotency key provided for other mutations, proceed without idempotency
  if (!idempotencyKey) {
    return next();
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(idempotencyKey)) {
    return next(
      new AppError('Idempotency-Key must be a valid UUID v4', 400, 'INVALID_IDEMPOTENCY_KEY')
    );
  }

  try {
    // Check if this key has been used before
    const { record, isNew } = await idempotencyService.createOrGet(
      idempotencyKey,
      {
        method: req.method,
        path: req.path,
        body: req.body,
      },
      req.traceId
    );

    // Attach to request for later use
    req.idempotencyKey = idempotencyKey;
    req.idempotencyRecord = record;

    // If this is a duplicate request
    if (!isNew) {
      // If still processing, return 409 Conflict
      if (record.status === 'processing') {
        return res.status(409).json({
          code: 'REQUEST_IN_PROGRESS',
          message: 'A request with this idempotency key is already being processed',
          traceId: req.traceId,
        });
      }

      // If completed, return cached response
      if (record.status === 'completed') {
        return res.status(record.statusCode).json(record.responseBody);
      }

      // If failed, return cached error
      if (record.status === 'failed') {
        return res.status(record.statusCode).json(record.responseBody);
      }
    }

    // This is a new request, proceed
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to mark idempotency record as completed (use in route handlers)
 */
export async function markIdempotencyCompleted(
  req,
  responseBody,
  statusCode,
  resourceId,
  resourceType
) {
  if (req.idempotencyKey) {
    await idempotencyService.markCompleted(
      req.idempotencyKey,
      responseBody,
      statusCode,
      resourceId,
      resourceType
    );
  }
}

/**
 * Helper to mark idempotency record as failed (use in error handler)
 */
export async function markIdempotencyFailed(req, responseBody, statusCode) {
  if (req.idempotencyKey) {
    await idempotencyService.markFailed(req.idempotencyKey, responseBody, statusCode);
  }
}
