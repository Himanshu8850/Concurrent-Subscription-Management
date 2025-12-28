import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    totalCustomers: 0,
    totalSubscriptions: 0,
    seatsAvailable: 0,
    seatsUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch plans
      const plansResponse = await apiClient.get("/plans");
      const plans = plansResponse.data.plans || [];

      // Fetch customers
      const customersResponse = await apiClient.get("/customers");
      const customers = customersResponse.data || [];

      // Calculate stats
      const totalPlans = plans.length;
      const activePlans = plans.filter((p) => p.status === "active").length;
      const totalCustomers = customers.length;

      // Calculate seats
      const seatsAvailable = plans.reduce(
        (sum, plan) => sum + (plan.subscriptions_left || 0),
        0
      );
      const seatsUsed = plans.reduce((sum, plan) => {
        const used = plan.total_capacity - (plan.subscriptions_left || 0);
        return sum + used;
      }, 0);

      setStats({
        totalPlans,
        activePlans,
        totalCustomers,
        totalSubscriptions: seatsUsed,
        seatsAvailable,
        seatsUsed,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Subscription Management System
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
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Plan Management Card */}
          <Link to="/admin/plans">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Plan Management
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Create, edit, and manage subscription plans
                  </p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
              <div className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                Go to Plans →
              </div>
            </div>
          </Link>

          {/* Customer Management Card */}
          <Link to="/admin/customers">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Customers & Subscriptions
                  </h2>
                  <p className="text-gray-600 mt-2">
                    View customers and their subscription details
                  </p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
              <div className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                Go to Customers →
              </div>
            </div>
          </Link>

          {/* Request Monitor Card */}
          <Link to="/admin/requests">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Request Monitor
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Real-time request tracking and analytics
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
              <div className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                Go to Monitor →
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Total Plans</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.totalPlans}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">
              Total Customers
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.totalCustomers}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">
              Total Subscriptions
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? "..." : stats.totalSubscriptions}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
