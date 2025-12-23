import 'dotenv/config';
import mongoose from 'mongoose';
import { Plan, Customer, Subscription, IdempotencyRecord, AuditLog } from '../src/models/index.js';
import logger from '../src/utils/logger.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cstl-stripe-clone';

async function resetDatabase() {
  try {
    logger.info({ mongoUri: MONGO_URI }, 'Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    logger.info('Connected successfully');

    logger.warn('⚠️  RESETTING DATABASE - This will delete ALL data!');

    // Delete all collections
    await Plan.deleteMany({});
    logger.info('✓ Plans deleted');

    await Customer.deleteMany({});
    logger.info('✓ Customers deleted');

    await Subscription.deleteMany({});
    logger.info('✓ Subscriptions deleted');

    await IdempotencyRecord.deleteMany({});
    logger.info('✓ Idempotency records deleted');

    await AuditLog.deleteMany({});
    logger.info('✓ Audit logs deleted');

    logger.info('✅ Database reset complete!');
    logger.info('\n💡 Run `npm run seed` to populate with sample data');

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Failed to reset database');
    process.exit(1);
  }
}

resetDatabase();
