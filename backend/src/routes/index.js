import express from 'express';
import plansRouter from './plans.js';
import subscriptionsRouter from './subscriptions.js';
import customersRouter from './customers.js';
import auditLogsRouter from './auditLogs.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routers
router.use('/plans', plansRouter);
router.use('/subscriptions', subscriptionsRouter);
router.use('/customers', customersRouter);
router.use('/audit-logs', auditLogsRouter);

export default router;
