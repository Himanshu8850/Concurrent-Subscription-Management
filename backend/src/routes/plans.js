import express from 'express';
import planService from '../services/planService.js';
import { createPlanValidation, objectIdValidation } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/plans
 * @desc    Get all plans
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, includeInactive } = req.query;
    const plans = await planService.getPlans({
      status,
      includeInactive: includeInactive === 'true',
    });

    res.json({
      plans,
      count: plans.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/plans/:id
 * @desc    Get plan by ID
 * @access  Public
 */
router.get('/:id', objectIdValidation('id'), async (req, res, next) => {
  try {
    const plan = await planService.getPlan(req.params.id);
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/plans/:id/stats
 * @desc    Get plan statistics
 * @access  Public
 */
router.get('/:id/stats', objectIdValidation('id'), async (req, res, next) => {
  try {
    const stats = await planService.getPlanStatistics(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/plans
 * @desc    Create a new plan (admin)
 * @access  Private
 */
router.post('/', createPlanValidation, async (req, res, next) => {
  try {
    const plan = await planService.createPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/plans/:id
 * @desc    Update plan (admin)
 * @access  Private
 */
router.patch('/:id', objectIdValidation('id'), async (req, res, next) => {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body);
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/plans/:id
 * @desc    Update plan (admin)
 * @access  Private
 */
router.put('/:id', objectIdValidation('id'), async (req, res, next) => {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body);
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/plans/:id
 * @desc    Delete plan (admin)
 * @access  Private
 */
router.delete('/:id', objectIdValidation('id'), async (req, res, next) => {
  try {
    const plan = await planService.deletePlan(req.params.id);
    res.json({
      message: 'Plan deleted successfully',
      plan,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
