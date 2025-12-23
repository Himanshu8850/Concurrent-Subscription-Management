import { IdempotencyRecord } from '../models/index.js';

/**
 * Create or retrieve idempotency record
 */
async function createOrGet(key, requestBody, traceId) {
  const ttlDays = parseInt(process.env.IDEMPOTENCY_TTL_DAYS || '30', 10);
  return await IdempotencyRecord.createOrGet(key, requestBody, traceId, ttlDays);
}

/**
 * Mark idempotency record as completed
 */
async function markCompleted(key, responseBody, statusCode, resourceId, resourceType) {
  return await IdempotencyRecord.markCompleted(
    key,
    responseBody,
    statusCode,
    resourceId,
    resourceType
  );
}

/**
 * Mark idempotency record as failed
 */
async function markFailed(key, responseBody, statusCode) {
  return await IdempotencyRecord.markFailed(key, responseBody, statusCode);
}

/**
 * Get idempotency record by key
 */
async function getByKey(key) {
  return await IdempotencyRecord.findOne({ key });
}

export default {
  createOrGet,
  markCompleted,
  markFailed,
  getByKey,
};
