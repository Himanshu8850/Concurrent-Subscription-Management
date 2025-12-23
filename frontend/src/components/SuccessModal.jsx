export default function SuccessModal({ subscription, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Purchase Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your subscription to{" "}
            <span className="font-semibold">{subscription.planName}</span> is
            now active.
          </p>

          {/* Subscription Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subscription ID</span>
                <span className="font-mono text-xs text-gray-900">
                  {subscription.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="badge badge-success">
                  {subscription.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date</span>
                <span className="text-gray-900">
                  {new Date(subscription.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date</span>
                <span className="text-gray-900">
                  {new Date(subscription.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-bold text-gray-900">
                  ${(subscription.amount_cents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Trace ID for debugging */}
          {subscription.traceId && (
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Trace: {subscription.traceId}
            </p>
          )}

          {/* Close Button */}
          <button onClick={onClose} className="btn btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
