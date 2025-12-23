import { useState } from "react";
import PlansList from "./components/PlansList";
import PurchaseModal from "./components/PurchaseModal";
import SuccessModal from "./components/SuccessModal";
import "./index.css";

// Mock customer ID - in production this would come from auth
const MOCK_CUSTOMER_ID = "676e8a1b2c3d4e5f6a7b8c9d";

function App() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  const handlePurchaseClick = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePurchaseSuccess = (subscription) => {
    setPurchaseSuccess(subscription);
    setSelectedPlan(null);
  };

  const handleCloseModals = () => {
    setSelectedPlan(null);
    setPurchaseSuccess(null);
    // Reload page to refresh plan data
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                cstl-stripe-clone
              </h1>
              <p className="text-gray-600 mt-1">
                Subscription Management Platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-600">System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <svg
              className="h-5 w-5 text-blue-600 mr-3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Limited Capacity Plans</span> -
                All plans have limited seats. Purchase early to secure your
                spot!
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Test Customer ID:{" "}
                <code className="font-mono bg-blue-100 px-1 rounded">
                  {MOCK_CUSTOMER_ID}
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* Plans List */}
        <PlansList
          onPurchaseClick={handlePurchaseClick}
          customerId={MOCK_CUSTOMER_ID}
        />
      </main>

      {/* Modals */}
      {selectedPlan && (
        <PurchaseModal
          plan={selectedPlan}
          customerId={MOCK_CUSTOMER_ID}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {purchaseSuccess && (
        <SuccessModal
          subscription={purchaseSuccess}
          onClose={handleCloseModals}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Built with atomic seat reservation and idempotency guarantees
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
