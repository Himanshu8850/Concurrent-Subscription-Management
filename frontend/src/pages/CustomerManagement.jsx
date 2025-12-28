import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CustomerTable from "../components/CustomerTable";
import { apiClient } from "../services/api";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSubscriptions, setCustomerSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/customers");
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch customers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customerId) => {
    setSelectedCustomerId(customerId);
    await fetchCustomerSubscriptions(customerId);
  };

  const fetchCustomerSubscriptions = async (customerId) => {
    try {
      setLoadingSubscriptions(true);
      const response = await apiClient.get(
        `/subscriptions/customer/${customerId}`
      );
      setCustomerSubscriptions(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch subscriptions");
      console.error(err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const getSelectedCustomer = () => {
    return customers.find((c) => c._id === selectedCustomerId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Customers & Subscriptions
          </h1>
          <p className="text-gray-600 mt-1">
            View customer details and their subscriptions
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Customers
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No customers found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer._id}
                      onClick={() => handleSelectCustomer(customer._id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCustomerId === customer._id
                          ? "bg-blue-50 border-l-4 border-blue-600"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                          customer.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer Details & Subscriptions */}
          <div className="lg:col-span-2">
            {selectedCustomerId ? (
              <div className="space-y-6">
                {/* Customer Details Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Customer Details
                  </h2>
                  {getSelectedCustomer() && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Name</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {getSelectedCustomer().name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {getSelectedCustomer().email}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Status</label>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            getSelectedCustomer().status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {getSelectedCustomer().status}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">
                          Joined On
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(
                            getSelectedCustomer().created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subscriptions Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Subscriptions
                  </h2>

                  {loadingSubscriptions ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading subscriptions...</p>
                    </div>
                  ) : customerSubscriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No subscriptions found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Plan
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Status
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Start Date
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              End Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerSubscriptions.map((sub) => (
                            <tr
                              key={sub._id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 text-gray-900">
                                {sub.plan_id?.name || "Unknown Plan"}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    sub.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : sub.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {sub.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {new Date(sub.startDate).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {new Date(sub.endDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">
                  Select a customer to view details and subscriptions
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
