export default function PlanTable({ plans, onEdit, onDelete }) {
  const getOccupancyPercentage = (plan) => {
    if (plan.total_capacity === 0) return 0;
    return (
      ((plan.total_capacity - plan.subscriptions_left) / plan.total_capacity) *
      100
    );
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Convert cents to dollars
  const formatPrice = (priceCents) => {
    if (priceCents === undefined || priceCents === null) return "$0.00";
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  // Convert days to readable format
  const formatDuration = (days) => {
    if (!days) return "0 days";
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Plan Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Price
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Duration
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Capacity
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Occupancy
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {plans.map((plan) => {
              const occupancy = getOccupancyPercentage(plan);
              const progressColor = getProgressColor(occupancy);
              const used = plan.total_capacity - plan.subscriptions_left;

              return (
                <tr key={plan._id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {plan.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-900 font-semibold">
                    {formatPrice(plan.price_cents)}
                  </td>
                  <td className="py-4 px-4 text-gray-900">
                    {formatDuration(plan.duration_days)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-gray-900">
                      <span className="font-semibold">{used}</span>
                      <span className="text-gray-600">
                        {" "}
                        / {plan.total_capacity}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${progressColor} transition-all`}
                            style={{ width: `${occupancy}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900">
                          {Math.round(occupancy)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {plan.subscriptions_left} seats available
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        plan.status === "active"
                          ? "bg-green-100 text-green-800"
                          : plan.status === "inactive"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(plan)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(plan._id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
