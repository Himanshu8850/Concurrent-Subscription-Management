import express from 'express';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

/**
 * GET /api/audit-logs/recent
 * Get recent audit logs with filtering options
 */
router.get('/recent', async (req, res, next) => {
  try {
    const { limit = 100, action, resourceType, status } = req.query;

    const query = {};

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Filter by resource type
    if (resourceType) {
      query.resourceType = resourceType;
    }

    // Fetch logs with population
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('actor', 'name email')
      .lean();

    // Enrich logs with status information
    const enrichedLogs = logs.map(log => {
      let status = 'success';
      if (log.action.includes('failed')) {
        status = 'failed';
      } else if (log.action.includes('cancelled')) {
        status = 'cancelled';
      } else if (log.action.includes('created') || log.action.includes('activated')) {
        status = 'success';
      }

      return {
        ...log,
        status,
      };
    });

    res.json({
      logs: enrichedLogs,
      count: enrichedLogs.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit-logs/stats
 * Get statistics about requests
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { timeframe = '1h' } = req.query;

    // Calculate time window
    const now = new Date();
    let startTime = new Date(now - 60 * 60 * 1000); // Default 1 hour

    if (timeframe === '5m') {
      startTime = new Date(now - 5 * 60 * 1000);
    } else if (timeframe === '15m') {
      startTime = new Date(now - 15 * 60 * 1000);
    } else if (timeframe === '1h') {
      startTime = new Date(now - 60 * 60 * 1000);
    } else if (timeframe === '24h') {
      startTime = new Date(now - 24 * 60 * 60 * 1000);
    }

    const stats = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime },
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate totals
    const totalRequests = stats.reduce((sum, s) => sum + s.count, 0);
    const successfulPurchases = stats.find(s => s._id === 'subscription.created')?.count || 0;
    const failedPurchases = stats.find(s => s._id === 'subscription.failed')?.count || 0;
    const paymentFailures = stats.find(s => s._id === 'payment.failed')?.count || 0;

    res.json({
      timeframe,
      startTime,
      endTime: now,
      stats: {
        totalRequests,
        successfulPurchases,
        failedPurchases,
        paymentFailures,
        successRate:
          totalRequests > 0 ? ((successfulPurchases / totalRequests) * 100).toFixed(2) : 0,
      },
      breakdown: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit-logs/trace/:traceId
 * Get all logs for a specific trace ID
 */
router.get('/trace/:traceId', async (req, res, next) => {
  try {
    const { traceId } = req.params;

    const logs = await AuditLog.getByTraceId(traceId);

    res.json({
      traceId,
      logs,
      count: logs.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
