#!/usr/bin/env node

/**
 * Demo Traffic Generator
 *
 * Generates realistic traffic for demonstrating the Request Monitor
 * to interviewers. Shows various scenarios:
 * - Successful purchases
 * - Failed purchases (sold out)
 * - Payment failures
 * - Multiple concurrent users
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const DEMO_DURATION = 60000; // 1 minute
const REQUEST_INTERVAL = 2000; // 2 seconds between waves

const mockCustomers = [
  { name: 'Alice Johnson', email: 'alice@demo.com', phone: '+1-555-0101' },
  { name: 'Bob Smith', email: 'bob@demo.com', phone: '+1-555-0102' },
  { name: 'Carol White', email: 'carol@demo.com', phone: '+1-555-0103' },
  { name: 'David Brown', email: 'david@demo.com', phone: '+1-555-0104' },
  { name: 'Eve Davis', email: 'eve@demo.com', phone: '+1-555-0105' },
  { name: 'Frank Wilson', email: 'frank@demo.com', phone: '+1-555-0106' },
  { name: 'Grace Lee', email: 'grace@demo.com', phone: '+1-555-0107' },
  { name: 'Henry Taylor', email: 'henry@demo.com', phone: '+1-555-0108' },
];

let activeCustomers = [];
let activePlans = [];

async function setup() {
  console.log('🎬 Setting up demo environment...\n');

  try {
    // Fetch available plans
    const plansResponse = await fetch(`${API_URL}/plans`);
    const plansData = await plansResponse.json();
    activePlans = plansData.plans || [];

    if (activePlans.length === 0) {
      console.error('❌ No plans available. Please seed the database first.');
      process.exit(1);
    }

    console.log(`✓ Found ${activePlans.length} active plans`);

    // Create demo customers if they don't exist
    for (const customer of mockCustomers) {
      try {
        const response = await fetch(`${API_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...customer,
            status: 'active',
            paymentMethods: [
              {
                id: `pm_demo_${uuidv4()}`,
                type: 'card',
                last4: '4242',
                isDefault: true,
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          activeCustomers.push(data.customer);
        } else {
          // Customer might already exist, try to find them
          const customersResponse = await fetch(`${API_URL}/customers`);
          const customersData = await customersResponse.json();
          const existing = customersData.find(c => c.email === customer.email);
          if (existing) {
            activeCustomers.push(existing);
          }
        }
      } catch (error) {
        console.error(`Failed to create customer ${customer.name}:`, error.message);
      }
    }

    console.log(`✓ Prepared ${activeCustomers.length} demo customers\n`);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

async function makePurchaseRequest(customer, plan, shouldFail = false) {
  try {
    const paymentMethodId = shouldFail
      ? 'pm_fail_test'
      : customer.paymentMethods?.[0]?.id || 'pm_test';

    const response = await fetch(`${API_URL}/subscriptions/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': uuidv4(),
      },
      body: JSON.stringify({
        planId: plan._id,
        customerId: customer._id,
        paymentMethodId,
      }),
    });

    const data = await response.json();
    const status = response.status === 201 ? '✅' : '❌';
    const reason = data.code || data.message || 'unknown';

    console.log(`${status} ${customer.name} → ${plan.name} (${response.status} ${reason})`);

    return { success: response.status === 201, data };
  } catch (error) {
    console.log(`❌ ${customer.name} → ${plan.name} (Network error)`);
    return { success: false, error };
  }
}

async function generateTrafficWave() {
  const numRequests = Math.floor(Math.random() * 3) + 2; // 2-4 requests per wave
  const promises = [];

  for (let i = 0; i < numRequests; i++) {
    const customer = activeCustomers[Math.floor(Math.random() * activeCustomers.length)];
    const plan = activePlans[Math.floor(Math.random() * activePlans.length)];

    // 10% chance of payment failure simulation
    const shouldFail = Math.random() < 0.1;

    promises.push(makePurchaseRequest(customer, plan, shouldFail));
  }

  await Promise.all(promises);
}

async function runDemo() {
  console.log('📊 Starting demo traffic generation...');
  console.log(`Duration: ${DEMO_DURATION / 1000} seconds`);
  console.log(`Wave interval: ${REQUEST_INTERVAL / 1000} seconds\n`);
  console.log('Watch the Request Monitor at: http://localhost:5173/admin/requests\n');
  console.log('─'.repeat(60) + '\n');

  const startTime = Date.now();
  let waveCount = 0;

  const interval = setInterval(async () => {
    const elapsed = Date.now() - startTime;

    if (elapsed >= DEMO_DURATION) {
      clearInterval(interval);
      console.log('\n' + '─'.repeat(60));
      console.log('✨ Demo completed!');
      console.log('\nCheck the Request Monitor dashboard to see:');
      console.log('  • Real-time request visualization');
      console.log('  • Success/failure statistics');
      console.log('  • Request timing and patterns');
      console.log('  • System behavior under load\n');
      process.exit(0);
    }

    waveCount++;
    console.log(`\n🌊 Wave ${waveCount} (${Math.floor(elapsed / 1000)}s elapsed):`);
    await generateTrafficWave();
  }, REQUEST_INTERVAL);
}

async function main() {
  try {
    // Check if server is running
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.error('❌ Cannot connect to API at', API_URL);
    console.error('Make sure the backend server is running (npm run dev)\n');
    process.exit(1);
  }

  await setup();
  await runDemo();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
