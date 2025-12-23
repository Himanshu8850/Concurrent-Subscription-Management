import express from 'express';
import subscriptionService from '../services/subscriptionService.js';
import { Customer } from '../models/index.js';
import { objectIdValidation, paginationValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/customers
 * @desc    List customers (basic info for testing/demo)
 * @access  Public (for demo purposes)
 */
router.get('/', async (req, res, next) => {
  try {
    const customers = await Customer.find({}, { name: 1, email: 1 }).sort({ createdAt: -1 }).lean();
    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/customers/:id/subscriptions
 * @desc    Get customer subscriptions
 * @access  Public (should validate ownership in production)
 */
router.get(
  '/:id/subscriptions',
  [...objectIdValidation('id'), ...paginationValidation],
  async (req, res, next) => {
    try {
      const { status, limit = 50, skip = 0 } = req.query;

      const result = await subscriptionService.getCustomerSubscriptions(req.params.id, {
        status,
        limit: parseInt(limit),
        skip: parseInt(skip),
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
