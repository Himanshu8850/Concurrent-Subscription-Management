import { useState, useEffect } from "react";
import api from "../services/api";

export default function PlansList({ onPurchaseClick, customerId }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPlans();
      setPlans(data.plans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Error loading plans</p>
        <p className="text-sm">{error}</p>
        <button onClick={loadPlans} className="btn btn-secondary mt-2 text-sm">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            onPurchaseClick={onPurchaseClick}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, onPurchaseClick }) {
  const isSoldOut = plan.subscriptions_left === 0;
  const isLowStock =
    plan.subscriptions_left <= plan.total_capacity * 0.2 && !isSoldOut;

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        {isSoldOut && <span className="badge badge-error">Sold Out</span>}
        {isLowStock && <span className="badge badge-warning">Limited</span>}
      </div>

      <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>

      <div className="mb-4">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">
            ${(plan.price_cents / 100).toFixed(2)}
          </span>
          <span className="text-gray-600 ml-2">/{plan.duration_days} days</span>
        </div>
      </div>

      {plan.features && plan.features.length > 0 && (
        <div className="mb-4">
          <ul className="space-y-2">
            {plan.features.slice(0, 4).map((feature, idx) => (
              <li key={idx} className="flex items-start text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Available seats</span>
          <span
            className={`font-bold ${isSoldOut ? "text-red-600" : "text-green-600"}`}
          >
            {plan.subscriptions_left} / {plan.total_capacity}
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isSoldOut
                ? "bg-red-500"
                : isLowStock
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{
              width: `${((plan.total_capacity - plan.subscriptions_left) / plan.total_capacity) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      <button
        onClick={() => onPurchaseClick(plan)}
        disabled={isSoldOut}
        className="btn btn-primary w-full"
      >
        {isSoldOut ? "Sold Out" : "Purchase Now"}
      </button>
    </div>
  );
}
