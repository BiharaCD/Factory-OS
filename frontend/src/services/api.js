import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Inventory
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
};

// Suppliers
export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Customers
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Purchase Orders
export const purchaseOrdersAPI = {
  getAll: () => api.get('/purchase-orders'),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  updateStatus: (id, status) => api.patch(`/purchase-orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
};

// GRN
export const grnAPI = {
  getAll: () => api.get('/grn'),
  getById: (id) => api.get(`/grn/${id}`),
  create: (data) => api.post('/grn', data),
  updateStatus: (id, status) => api.patch(`/grn/${id}/status`, { status }),
};

// Supplier Bills
export const supplierBillsAPI = {
  getAll: () => api.get('/supplier-bills'),
  getById: (id) => api.get(`/supplier-bills/${id}`),
  create: (data) => api.post('/supplier-bills', data),
  updateStatus: (id, status) => api.patch(`/supplier-bills/${id}/status`, { status }),
  delete: (id) => api.delete(`/supplier-bills/${id}`),
};

// Production Batches
export const productionBatchesAPI = {
  getAll: () => api.get('/production-batches'),
  getById: (id) => api.get(`/production-batches/${id}`),
  create: (data) => api.post('/production-batches', data),
  updateStatus: (id, status) => api.patch(`/production-batches/${id}/status`, { status }),
  updateQCresult: (id, QCresult) => api.patch(`/production-batches/${id}/QCresult`, { QCresult }),
};

// Sales Dispatch
export const salesDispatchAPI = {
  getAll: () => api.get('/sales-dispatches'),
  getById: (id) => api.get(`/sales-dispatches/${id}`),
  create: (data) => api.post('/sales-dispatches', data),
  updateStatus: (id, status) => api.patch(`/sales-dispatches/${id}/status`, { status }),
};

// Customer Invoices
export const customerInvoicesAPI = {
  getAll: () => api.get('/customer-invoices'),
  getById: (id) => api.get(`/customer-invoices/${id}`),
  create: (data) => api.post('/customer-invoices', data),
  updateStatus: (id, status) => api.patch(`/customer-invoices/${id}/status`, { status }),
};

export default api;
