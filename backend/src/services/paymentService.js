/**
 * Mock Payment Service
 *
 * In production, this would integrate with Stripe, PayPal, etc.
 * For the assignment, this simulates payment processing with configurable success/failure.
 */

// Simulate payment processing delay
const PAYMENT_DELAY_MS = 100;

// Success rate (0.0 to 1.0) - set to 1.0 for always success, 0.9 for 90% success
const SUCCESS_RATE = 0.95;

/**
 * Process a payment
 * @param {Object} params - Payment parameters
 * @param {number} params.amount_cents - Amount in cents
 * @param {string} params.customerId - Customer ID
 * @param {string} params.paymentMethodId - Payment method ID
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Payment result
 */
async function processPayment({ amount_cents, customerId, paymentMethodId, metadata = {} }) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, PAYMENT_DELAY_MS));

  // Simulate random failures based on SUCCESS_RATE
  const shouldSucceed = Math.random() < SUCCESS_RATE;

  if (!shouldSucceed) {
    throw new Error('Payment declined by provider');
  }

  // Mock successful payment response
  return {
    paymentId: `pay_${generateId()}`,
    status: 'succeeded',
    amount_cents,
    customerId,
    paymentMethodId,
    processedAt: new Date().toISOString(),
    metadata,
  };
}

/**
 * Refund a payment
 * @param {string} paymentId - Payment ID to refund
 * @param {number} amount_cents - Amount to refund (partial or full)
 * @returns {Promise<Object>} Refund result
 */
async function refundPayment(paymentId, amount_cents) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, PAYMENT_DELAY_MS));

  return {
    refundId: `ref_${generateId()}`,
    paymentId,
    amount_cents,
    status: 'succeeded',
    processedAt: new Date().toISOString(),
  };
}

/**
 * Get payment status
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Payment status
 */
async function getPaymentStatus(paymentId) {
  return {
    paymentId,
    status: 'succeeded',
    retrievedAt: new Date().toISOString(),
  };
}

/**
 * Generate a mock ID
 * @returns {string} Random ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default {
  processPayment,
  refundPayment,
  getPaymentStatus,
};
