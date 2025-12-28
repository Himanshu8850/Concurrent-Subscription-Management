import { useState, useEffect } from "react";

export default function PlanForm({ plan, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    total_capacity: "",
    status: "active",
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description,
        price: plan.price_cents ? plan.price_cents / 100 : "",
        duration: plan.duration_days || "",
        total_capacity: plan.total_capacity,
        status: plan.status,
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert("Plan name is required");
      return;
    }
    if (!formData.description.trim()) {
      alert("Description is required");
      return;
    }
    if (formData.price <= 0) {
      alert("Price must be greater than 0");
      return;
    }
    if (formData.duration <= 0) {
      alert("Duration must be greater than 0");
      return;
    }
    if (formData.total_capacity <= 0) {
      alert("Total capacity must be greater than 0");
      return;
    }

    // Convert price to cents and duration to days for backend
    const dataToSubmit = {
      name: formData.name,
      description: formData.description,
      price_cents: Math.round(formData.price * 100),
      duration_days: parseInt(formData.duration),
      total_capacity: parseInt(formData.total_capacity),
      status: formData.status,
    };

    onSubmit(dataToSubmit);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {plan ? "Edit Plan" : "Create New Plan"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Plan Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Professional Plan"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what this plan includes..."
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Grid for Price, Duration, Capacity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Price ($) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="99.99"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Duration (Days) *
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="30"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Total Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Total Capacity (Seats) *
            </label>
            <input
              type="number"
              name="total_capacity"
              value={formData.total_capacity}
              onChange={handleChange}
              placeholder="100"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {plan ? "Update Plan" : "Create Plan"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
