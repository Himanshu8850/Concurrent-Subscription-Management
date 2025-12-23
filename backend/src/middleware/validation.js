import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';
import mongoose from 'mongoose';

/**
 * Middleware to check validation results
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return next(
      new AppError(firstError.msg, 400, 'VALIDATION_ERROR', {
        field: firstError.path,
        errors: errors.array(),
      })
    );
  }
  next();
}

/**
 * Validation rules for purchase subscription
 */
export const purchaseSubscriptionValidation = [
  body('planId')
    .notEmpty()
    .withMessage('planId is required')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('planId must be a valid ObjectId'),
  body('customerId')
    .notEmpty()
    .withMessage('customerId is required')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('customerId must be a valid ObjectId'),
  body('paymentMethodId')
    .notEmpty()
    .withMessage('paymentMethodId is required')
    .isString()
    .withMessage('paymentMethodId must be a string'),
  validate,
];

/**
 * Validation rules for ObjectId params
 */
export const objectIdValidation = paramName => [
  param(paramName)
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`${paramName} must be a valid ObjectId`),
  validate,
];

/**
 * Validation rules for create plan
 */
export const createPlanValidation = [
  body('name')
    .notEmpty()
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string')
    .isLength({ min: 3, max: 100 })
    .withMessage('name must be between 3 and 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('description is required')
    .isString()
    .withMessage('description must be a string')
    .isLength({ max: 500 })
    .withMessage('description must be less than 500 characters'),
  body('price_cents')
    .notEmpty()
    .withMessage('price_cents is required')
    .isInt({ min: 0 })
    .withMessage('price_cents must be a non-negative integer'),
  body('duration_days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('duration_days must be at least 1'),
  body('total_capacity')
    .notEmpty()
    .withMessage('total_capacity is required')
    .isInt({ min: 1 })
    .withMessage('total_capacity must be at least 1'),
  body('features').optional().isArray().withMessage('features must be an array'),
  validate,
];

/**
 * Validation rules for pagination
 */
export const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('skip').optional().isInt({ min: 0 }).withMessage('skip must be non-negative'),
  validate,
];
