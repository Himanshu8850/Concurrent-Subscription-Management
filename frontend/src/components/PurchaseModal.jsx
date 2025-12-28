import { useState } from "react";
import api from "../services/api";

export default function PurchaseModal({
  plan,
  customerId,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      const subscription = await api.purchaseSubscription(
        plan._id,
        customerId,
        "pm_test_card", // Mock payment method
        plan.subscriptions_left
      );

      onSuccess(subscription);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Confirm Purchase
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Plan Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              {plan.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-bold text-gray-900">
                  ${(plan.price_cents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-bold text-gray-900">
                  {plan.duration_days} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seats remaining</span>
                <span className="font-bold text-green-600">
                  {plan.subscriptions_left}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="font-medium text-red-800">{error.message}</p>
              {error.code && (
                <p className="text-sm text-red-600 mt-1">
                  Error code: {error.code}
                </p>
              )}
              {error.traceId && (
                <p className="text-xs text-red-500 mt-1 font-mono">
                  Trace: {error.traceId}
                </p>
              )}
            </div>
          )}

          {/* Payment Info */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="border border-gray-300 rounded-lg p-3 bg-white">
              <div className="flex items-center">
                <svg
                  className="w-10 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <rect width="20" height="14" y="3" rx="2" />
                </svg>
                <span className="ml-3 text-gray-700">Test Card •••• 4242</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is a test environment. No real charges will be made.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="btn btn-primary flex-1 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                `Pay $${(plan.price_cents / 100).toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
