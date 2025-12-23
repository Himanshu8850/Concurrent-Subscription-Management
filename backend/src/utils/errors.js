/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response formatter
 */
export function formatError(error, traceId) {
  if (error.isOperational) {
    return {
      code: error.code,
      message: error.message,
      traceId,
      ...(Object.keys(error.details).length > 0 && { details: error.details }),
    };
  }

  // For non-operational errors, don't expose details
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    traceId,
  };
}
