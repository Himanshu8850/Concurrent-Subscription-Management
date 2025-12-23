import 'dotenv/config';
import mongoose from 'mongoose';
import { Plan, Customer } from '../src/models/index.js';
import logger from '../src/utils/logger.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cstl-stripe-clone';

const plans = [
  {
    name: 'Starter Plan',
    description:
      'Perfect for individuals just getting started. Limited capacity for exclusive access.',
    price_cents: 999, // $9.99
    duration_days: 30,
    total_capacity: 10,
    subscriptions_left: 10,
    status: 'active',
    features: ['Basic features', 'Email support', '10 GB storage', 'Community access'],
  },
  {
    name: 'Professional Plan',
    description: 'For professionals who need more power. Very limited seats available!',
    price_cents: 2999, // $29.99
    duration_days: 30,
    total_capacity: 50,
    subscriptions_left: 50,
    status: 'active',
    features: [
      'All Starter features',
      'Priority support',
      '100 GB storage',
      'Advanced analytics',
      'API access',
    ],
  },
  {
    name: 'Enterprise Plan',
    description: 'Premium tier for large teams. Extremely limited availability.',
    price_cents: 9999, // $99.99
    duration_days: 30,
    total_capacity: 100,
    subscriptions_left: 100,
    status: 'active',
    features: [
      'All Professional features',
      '24/7 dedicated support',
      'Unlimited storage',
      'Custom integrations',
      'SLA guarantee',
      'Training sessions',
    ],
  },
  {
    name: 'Limited Beta Access',
    description: 'Exclusive early access to new features. Only 5 spots available!',
    price_cents: 4999, // $49.99
    duration_days: 90,
    total_capacity: 5,
    subscriptions_left: 5,
    status: 'active',
    features: [
      'Beta feature access',
      'Direct feedback channel',
      'Influence roadmap',
      'Special badge',
    ],
  },
  {
    name: 'Team Plan',
    description: 'Great for small teams collaborating on projects.',
    price_cents: 4999, // $49.99
    duration_days: 30,
    total_capacity: 25,
    subscriptions_left: 25,
    status: 'active',
    features: ['All Starter features', 'Shared workspace', 'Role-based access', '50 GB per user'],
  },
  {
    name: 'Scale Plan',
    description: 'High-capacity tier for growing organizations.',
    price_cents: 19999, // $199.99
    duration_days: 30,
    total_capacity: 200,
    subscriptions_left: 200,
    status: 'active',
    features: [
      'All Enterprise features',
      'Priority SLAs',
      'Custom security reviews',
      'Dedicated onboarding',
    ],
  },
];

const sampleCustomers = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1-555-0101',
    status: 'active',
    paymentMethods: [
      {
        id: 'pm_test_alice_card',
        type: 'card',
        last4: '4242',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    phone: '+1-555-0102',
    status: 'active',
    paymentMethods: [
      {
        id: 'pm_test_bob_card',
        type: 'card',
        last4: '5555',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Charlie Davis',
    email: 'charlie.davis@example.com',
    phone: '+1-555-0103',
    status: 'active',
    paymentMethods: [
      {
        id: 'pm_test_charlie_card',
        type: 'card',
        last4: '8888',
        isDefault: true,
      },
    ],
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    logger.info({ mongoUri: MONGO_URI }, 'Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    logger.info('Connected successfully');

    // Clear existing data
    logger.info('Clearing existing plans...');
    await Plan.deleteMany({});
    logger.info('Clearing existing customers...');
    await Customer.deleteMany({});

    // Insert plans
    logger.info('Inserting plans...');
    const insertedPlans = await Plan.insertMany(plans);
    logger.info({ count: insertedPlans.length }, 'Plans inserted successfully');

    insertedPlans.forEach(plan => {
      logger.info(
        {
          id: plan._id.toString(),
          name: plan.name,
          capacity: plan.total_capacity,
          price: `$${(plan.price_cents / 100).toFixed(2)}`,
        },
        'Plan created'
      );
    });

    // Insert sample customers
    logger.info('Inserting sample customers...');
    const insertedCustomers = await Customer.insertMany(sampleCustomers);
    logger.info({ count: insertedCustomers.length }, 'Customers inserted successfully');

    insertedCustomers.forEach(customer => {
      logger.info(
        {
          id: customer._id.toString(),
          name: customer.name,
          email: customer.email,
        },
        'Customer created'
      );
    });

    logger.info('✅ Database seeded successfully!');
    logger.info('\n📋 Summary:');
    logger.info(`   Plans: ${insertedPlans.length}`);
    logger.info(`   Customers: ${insertedCustomers.length}`);
    logger.info('\n🔑 Sample Customer IDs for testing:');
    insertedCustomers.forEach(customer => {
      logger.info(`   ${customer.name}: ${customer._id.toString()}`);
    });

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Failed to seed database');
    process.exit(1);
  }
}

seedDatabase();
