import { useState, useEffect } from "react";
import PlanForm from "../components/PlanForm";
import PlanTable from "../components/PlanTable";
import { apiClient } from "../services/api";

export default function PlanManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/plans");
      // API returns { plans: [...], count: N }
      setPlans(response.data.plans || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch plans");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      await apiClient.post("/plans", formData);
      setSuccess("Plan created successfully!");
      setShowForm(false);
      await fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create plan");
      console.error(err);
    }
  };

  const handleUpdate = async (planId, formData) => {
    try {
      await apiClient.put(`/plans/${planId}`, formData);
      setSuccess("Plan updated successfully!");
      setEditingPlan(null);
      await fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update plan");
      console.error(err);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) {
      return;
    }

    try {
      await apiClient.delete(`/plans/${planId}`);
      setSuccess("Plan deleted successfully!");
      await fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete plan");
      console.error(err);
    }
  };

  const handleEditClick = (plan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPlan(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-gray-600 mt-1">
            Create, edit, and manage subscription plans
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

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Add Plan Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add New Plan
          </button>
        )}

        {/* Plan Form */}
        {showForm && (
          <div className="mb-6">
            <PlanForm
              plan={editingPlan}
              onSubmit={
                editingPlan
                  ? (data) => handleUpdate(editingPlan._id, data)
                  : handleCreate
              }
              onCancel={handleCloseForm}
            />
          </div>
        )}

        {/* Plans Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">
              No plans found. Create one to get started!
            </p>
          </div>
        ) : (
          <PlanTable
            plans={plans}
            onEdit={handleEditClick}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}
