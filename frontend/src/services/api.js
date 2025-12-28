import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add trace ID to all requests
apiClient.interceptors.request.use(
  (config) => {
    config.headers["X-Trace-Id"] = uuidv4();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data || {};
    return Promise.reject({
      message: errorData.message || "An unexpected error occurred",
      code: errorData.code || "UNKNOWN_ERROR",
      traceId: errorData.traceId,
      status: error.response?.status,
    });
  }
);

/**
 * API Service
 */
const api = {
  // Plans
  getPlans: async () => {
    const response = await apiClient.get("/plans");
    return response.data;
  },

  getPlan: async (planId) => {
    const response = await apiClient.get(`/plans/${planId}`);
    return response.data;
  },

  getPlanStats: async (planId) => {
    const response = await apiClient.get(`/plans/${planId}/stats`);
    return response.data;
  },

  createPlan: async (planData) => {
    const response = await apiClient.post("/plans", planData);
    return response.data;
  },

  updatePlan: async (planId, planData) => {
    const response = await apiClient.put(`/plans/${planId}`, planData);
    return response.data;
  },

  deletePlan: async (planId) => {
    const response = await apiClient.delete(`/plans/${planId}`);
    return response.data;
  },

  // Subscriptions
  purchaseSubscription: async (planId, customerId, paymentMethodId) => {
    const idempotencyKey = uuidv4();
    const response = await apiClient.post(
      "/subscriptions/purchase",
      {
        planId,
        customerId,
        paymentMethodId,
      },
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      }
    );
    return response.data;
  },

  getSubscription: async (subscriptionId) => {
    const response = await apiClient.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  },

  cancelSubscription: async (subscriptionId, customerId) => {
    const response = await apiClient.post(
      `/subscriptions/${subscriptionId}/cancel`,
      {
        customerId,
      }
    );
    return response.data;
  },

  // Customers
  getCustomers: async () => {
    const response = await apiClient.get("/customers");
    return response.data;
  },

  getCustomer: async (customerId) => {
    const response = await apiClient.get(`/customers/${customerId}`);
    return response.data;
  },

  getCustomerSubscriptions: async (customerId, params = {}) => {
    const response = await apiClient.get(
      `/subscriptions/customer/${customerId}`,
      { params }
    );
    return response.data;
  },

  // Audit Logs
  getRecentLogs: async (params = {}) => {
    const response = await apiClient.get("/audit-logs/recent", { params });
    return response.data;
  },

  getLogStats: async (timeframe = "1h") => {
    const response = await apiClient.get("/audit-logs/stats", {
      params: { timeframe },
    });
    return response.data;
  },

  getLogsByTrace: async (traceId) => {
    const response = await apiClient.get(`/audit-logs/trace/${traceId}`);
    return response.data;
  },
};

export { apiClient };
export default api;
