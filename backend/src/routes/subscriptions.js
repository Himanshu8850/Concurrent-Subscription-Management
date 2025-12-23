import express from 'express';
import subscriptionService from '../services/subscriptionService.js';
import { purchaseSubscriptionValidation, objectIdValidation } from '../middleware/validation.js';
import { markIdempotencyCompleted } from '../middleware/idempotency.js';

const router = express.Router();

/**
 * @route   POST /api/subscriptions/purchase
 * @desc    Purchase a subscription (with idempotency)
 * @access  Public
 * @headers Idempotency-Key (required)
 */
router.post('/purchase', purchaseSubscriptionValidation, async (req, res, next) => {
  try {
    const { planId, customerId, paymentMethodId } = req.body;

    const subscription = await subscriptionService.purchaseSubscription({
      planId,
      customerId,
      paymentMethodId,
      traceId: req.traceId,
      idempotencyKey: req.idempotencyKey,
    });

    // Format response
    const response = {
      id: subscription._id,
      status: subscription.status,
      planId: subscription.planId._id,
      planName: subscription.planId.name,
      customerId: subscription.customerId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      amount_cents: subscription.amount_cents,
      paymentId: subscription.paymentId,
      traceId: req.traceId,
    };

    // Mark idempotency as completed
    await markIdempotencyCompleted(req, response, 201, subscription._id.toString(), 'subscription');

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/subscriptions/:id
 * @desc    Get subscription by ID
 * @access  Public (should validate ownership in production)
 */
router.get('/:id', objectIdValidation('id'), async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscription(req.params.id);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/subscriptions/:id/cancel
 * @desc    Cancel a subscription
 * @access  Public (should validate ownership in production)
 */
router.post('/:id/cancel', objectIdValidation('id'), async (req, res, next) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId is required',
        traceId: req.traceId,
      });
    }

    const subscription = await subscriptionService.cancelSubscription(
      req.params.id,
      customerId,
      req.traceId
    );

    res.json({
      id: subscription._id,
      status: subscription.status,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
