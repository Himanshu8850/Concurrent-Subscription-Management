import { Plan } from '../models/index.js';
import { AppError } from '../utils/errors.js';

/**
 * Get all active plans
 */
async function getPlans({ status = 'active', includeInactive = false } = {}) {
  const query = includeInactive ? {} : { status };

  const plans = await Plan.find(query).sort({ price_cents: 1 }).lean();

  return plans;
}

/**
 * Get plan by ID
 */
async function getPlan(planId) {
  const plan = await Plan.findById(planId).lean();

  if (!plan) {
    throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
  }

  return plan;
}

/**
 * Create a new plan
 */
async function createPlan(planData) {
  const plan = new Plan({
    ...planData,
    subscriptions_left: planData.total_capacity,
  });

  await plan.save();
  return plan.toObject();
}

/**
 * Update plan
 */
async function updatePlan(planId, updates) {
  const plan = await Plan.findById(planId);

  if (!plan) {
    throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
  }

  // Prevent direct modification of subscriptions_left
  if ('subscriptions_left' in updates) {
    delete updates.subscriptions_left;
  }

  // If total_capacity is being updated, adjust subscriptions_left proportionally
  if (updates.total_capacity !== undefined) {
    const currentSold = plan.total_capacity - plan.subscriptions_left;
    plan.total_capacity = updates.total_capacity;
    plan.subscriptions_left = Math.max(0, updates.total_capacity - currentSold);
    delete updates.total_capacity;
  }

  Object.assign(plan, updates);
  await plan.save();

  return plan.toObject();
}

/**
 * Get plan statistics
 */
async function getPlanStatistics(planId) {
  const plan = await Plan.findById(planId);

  if (!plan) {
    throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
  }

  return {
    planId: plan._id,
    name: plan.name,
    totalCapacity: plan.total_capacity,
    subscriptionsLeft: plan.subscriptions_left,
    subscriptionsSold: plan.total_capacity - plan.subscriptions_left,
    occupancyPercentage: plan.occupancyPercentage,
    isSoldOut: plan.isSoldOut,
  };
}

/**
 * Delete plan
 */
async function deletePlan(planId) {
  const plan = await Plan.findById(planId);

  if (!plan) {
    throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
  }

  // Check if plan has active subscriptions
  const { Subscription } = await import('../models/index.js');
  const activeCount = await Subscription.countDocuments({
    plan_id: planId,
    status: { $in: ['active', 'pending'] },
  });

  if (activeCount > 0) {
    throw new AppError(
      'Cannot delete plan with active subscriptions',
      400,
      'PLAN_HAS_SUBSCRIPTIONS'
    );
  }

  await Plan.findByIdAndDelete(planId);
  return plan.toObject();
}

export default {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  getPlanStatistics,
  deletePlan,
};
