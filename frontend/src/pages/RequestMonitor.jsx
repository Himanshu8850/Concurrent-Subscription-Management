import { useState, useEffect } from "react";
import { apiClient } from "../services/api";

export default function RequestMonitor() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeframe, setTimeframe] = useState("1h");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchData();

    // Auto-refresh every 3 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, timeframe, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch logs
      const params = { limit: 50 };
      if (filter !== "all") {
        if (filter === "success") {
          params.action = "subscription.created";
        } else if (filter === "failed") {
          params.action = "subscription.failed";
        } else if (filter === "payment_failed") {
          params.action = "payment.failed";
        }
      }

      const [logsResponse, statsResponse] = await Promise.all([
        apiClient.get("/audit-logs/recent", { params }),
        apiClient.get("/audit-logs/stats", { params: { timeframe } }),
      ]);

      setLogs(logsResponse.data.logs || []);
      setStats(statsResponse.data.stats || {});
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (action) => {
    if (action.includes("created") || action.includes("activated")) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          Success
        </span>
      );
    } else if (action.includes("failed")) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          Failed
        </span>
      );
    } else if (action.includes("cancelled")) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          Cancelled
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          Info
        </span>
      );
    }
  };

  const getActionLabel = (action, metadata = {}) => {
    const labels = {
      "subscription.created": "Purchase Attempt Started",
      "subscription.activated": "Subscription Successfully Created",
      "subscription.cancelled": "Subscription Cancelled by Customer",
      "subscription.failed": "Purchase Request Failed",
      "payment.processed": "Payment Successfully Processed",
      "payment.failed": "Payment Processing Failed",
      "payment.refunded": "Payment Refunded to Customer",
      "plan.created": "New Plan Created by Admin",
      "plan.updated": "Plan Configuration Updated",
      "plan.capacity_decreased": "Seat Reserved (Capacity Decreased)",
      "plan.capacity_increased": "Seat Released (Capacity Restored)",
    };
    return labels[action] || action;
  };

  const getReasonText = (log) => {
    const metadata = log.metadata || {};

    if (log.action === "subscription.failed") {
      const reasons = {
        PLAN_SOLD_OUT: "⛔ Plan sold out - no seats available",
        PAYMENT_FAILED: "💳 Payment processing error",
        PLAN_NOT_FOUND: "🔍 Plan not found in database",
        PLAN_INACTIVE: "🚫 Plan is not currently active",
      };
      return (
        reasons[metadata.errorCode] || metadata.errorMessage || "Unknown error"
      );
    }

    if (log.action === "plan.capacity_increased" && metadata.reason) {
      if (metadata.reason === "payment_failed") {
        return "↩️ Rollback - Payment failed, seat released";
      }
    }

    if (log.action === "payment.failed") {
      return `❌ ${metadata.error || "Payment gateway error"}`;
    }

    return null;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;

    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Request Monitor
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time visualization of system requests
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-700">Auto-refresh (3s)</span>
              </label>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">
                Total Requests
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalRequests || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last {timeframe}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Successful</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.successfulPurchases || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.successRate || 0}% success rate
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Failed</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.failedPurchases || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Purchase failures</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">
                Payment Failed
              </h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {stats.paymentFailures || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Payment errors</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="5m">Last 5 minutes</option>
                <option value="15m">Last 15 minutes</option>
                <option value="1h">Last hour</option>
                <option value="24h">Last 24 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="success">Success Only</option>
                <option value="failed">Failed Only</option>
                <option value="payment_failed">Payment Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Request Log Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Requests
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing last {logs.length} events
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Details
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Trace ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No requests found. Try adjusting the filters or wait for
                      new activity.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const reasonText = getReasonText(log);
                    return (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600 text-xs whitespace-nowrap">
                          {formatTimestamp(log.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(log.action)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 text-sm">
                            {getActionLabel(log.action, log.metadata)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {reasonText ? (
                            <span className="text-xs text-gray-600">
                              {reasonText}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {log.actor?.name || log.actor?.email || "System"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs text-gray-500">
                            {log.traceId.substring(0, 8)}...
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
