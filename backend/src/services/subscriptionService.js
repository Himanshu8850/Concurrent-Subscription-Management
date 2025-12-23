import mongoose from 'mongoose';
import { Plan, Subscription, AuditLog } from '../models/index.js';
import paymentService from './paymentService.js';
import { AppError } from '../utils/errors.js';

/**
 * Transaction helper - wraps operations in MongoDB transaction with retry logic
 */
async function withTransaction(callback, maxRetries = 5) {
  let lastError;

  // Backoff schedule in ms: 100, 200, 400, 800, 1600
  const backoffs = [100, 200, 400, 800, 1600];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      lastError = error;
      await session.abortTransaction();

      // Retry on known transient labels
      const labels = error.errorLabels || [];
      const isTransient =
        labels.includes('TransientTransactionError') ||
        labels.includes('UnknownTransactionCommitResult');
      if (isTransient && attempt < maxRetries) {
        const delay = backoffs[attempt - 1] || backoffs[backoffs.length - 1];
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw error;
    } finally {
      session.endSession();
    }
  }

  throw lastError;
}

/**
 * Core subscription purchase logic with atomic seat reservation
 */
async function purchaseSubscription({
  planId,
  customerId,
  paymentMethodId,
  traceId,
  idempotencyKey,
}) {
  return await withTransaction(async session => {
    // Step 1: Get plan details (with lock)
    const plan = await Plan.findById(planId).session(session);
    if (!plan) {
      throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    if (plan.status !== 'active') {
      throw new AppError('Plan is not available', 400, 'PLAN_INACTIVE');
    }

    // Step 2: Atomic seat reservation using findOneAndUpdate with filter
    // This is the CRITICAL correctness guarantee - decrement only succeeds if capacity > 0
    const beforeCapacity = plan.subscriptions_left;

    let updatedPlan;
    try {
      updatedPlan = await Plan.reserveSeat(planId, session);
    } catch (error) {
      if (error.message === 'PLAN_SOLD_OUT') {
        throw new AppError('Plan is sold out', 409, 'PLAN_SOLD_OUT');
      }
      throw error;
    }

    // Step 3: Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Step 4: Create subscription record (status: pending)
    const subscriptionData = {
      planId: plan._id,
      customerId,
      status: 'pending',
      startDate,
      endDate,
      amount_cents: plan.price_cents,
      traceId,
      idempotencyKey,
      paymentStatus: 'pending',
    };

    const subscription = new Subscription(subscriptionData);
    await subscription.save({ session });

    // Step 5: Log capacity decrease
    await AuditLog.logAction({
      traceId,
      actor: customerId,
      actorType: 'Customer',
      action: 'plan.capacity_decreased',
      resource: 'Plan',
      resourceType: 'Plan',
      resourceId: plan._id,
      before: { subscriptions_left: beforeCapacity },
      after: { subscriptions_left: updatedPlan.subscriptions_left },
      metadata: { subscriptionId: subscription._id.toString() },
      session,
    });

    // Step 6: Process payment (CHARGE-FIRST policy)
    let paymentResult;
    try {
      paymentResult = await paymentService.processPayment({
        amount_cents: plan.price_cents,
        customerId,
        paymentMethodId,
        metadata: {
          subscriptionId: subscription._id.toString(),
          planId: plan._id.toString(),
        },
      });

      subscription.paymentId = paymentResult.paymentId;
    } catch (paymentError) {
      // Payment failed - mark subscription as failed
      subscription.status = 'failed';
      subscription.paymentStatus = 'failed';
      await subscription.save({ session });

      // Log payment failure
      await AuditLog.logAction({
        traceId,
        actor: customerId,
        actorType: 'Customer',
        action: 'payment.failed',
        resource: 'Payment',
        resourceType: 'Payment',
        resourceId: subscription._id,
        metadata: {
          error: paymentError.message,
          subscriptionId: subscription._id.toString(),
        },
        session,
      });

      // Release the seat (rollback capacity decrement)
      await Plan.releaseSeat(planId, session);

      // Log capacity increase (rollback)
      await AuditLog.logAction({
        traceId,
        actor: customerId,
        actorType: 'System',
        action: 'plan.capacity_increased',
        resource: 'Plan',
        resourceType: 'Plan',
        resourceId: plan._id,
        before: { subscriptions_left: updatedPlan.subscriptions_left },
        after: { subscriptions_left: updatedPlan.subscriptions_left + 1 },
        metadata: {
          reason: 'payment_failed',
          subscriptionId: subscription._id.toString(),
        },
        session,
      });

      throw new AppError('Payment processing failed', 402, 'PAYMENT_FAILED', {
        originalError: paymentError.message,
      });
    }

    // Step 7: Activate subscription
    subscription.status = 'active';
    subscription.paymentStatus = 'succeeded';
    await subscription.save({ session });

    // Step 8: Log subscription activation
    await AuditLog.logAction({
      traceId,
      actor: customerId,
      actorType: 'Customer',
      action: 'subscription.activated',
      resource: 'Subscription',
      resourceType: 'Subscription',
      resourceId: subscription._id,
      after: {
        status: 'active',
        planId: plan._id.toString(),
        startDate,
        endDate,
      },
      metadata: {
        paymentId: paymentResult.paymentId,
      },
      session,
    });

    // Return populated subscription
    return await Subscription.findById(subscription._id).populate('planId').session(session).lean();
  });
}

/**
 * Get subscription by ID
 */
async function getSubscription(subscriptionId) {
  const subscription = await Subscription.findById(subscriptionId).populate('planId').lean();

  if (!subscription) {
    throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  return subscription;
}

/**
 * Get customer subscriptions
 */
async function getCustomerSubscriptions(customerId, { status, limit = 50, skip = 0 } = {}) {
  const query = { customerId };
  if (status) {
    query.status = status;
  }

  const subscriptions = await Subscription.find(query)
    .populate('planId')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Subscription.countDocuments(query);

  return {
    subscriptions,
    total,
    limit,
    skip,
  };
}

/**
 * Cancel subscription
 */
async function cancelSubscription(subscriptionId, customerId, traceId) {
  return await withTransaction(async session => {
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      customerId,
    }).session(session);

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    if (subscription.status === 'cancelled') {
      throw new AppError('Subscription already cancelled', 400, 'ALREADY_CANCELLED');
    }

    const beforeStatus = subscription.status;
    await subscription.cancel(session);

    // Log cancellation
    await AuditLog.logAction({
      traceId,
      actor: customerId,
      actorType: 'Customer',
      action: 'subscription.cancelled',
      resource: 'Subscription',
      resourceType: 'Subscription',
      resourceId: subscription._id,
      before: { status: beforeStatus },
      after: { status: 'cancelled' },
      session,
    });

    return subscription.toObject();
  });
}

export default {
  purchaseSubscription,
  getSubscription,
  getCustomerSubscriptions,
  cancelSubscription,
  withTransaction,
};
