// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
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

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);





export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

// Update the expenseAPI object to include the create method
export const expenseAPI = {
  getAll: async () => {
    const response = await api.get('/expenses');
    return response.data;
  },
  create: async (expenseData) => {
    const response = await api.post('/expenses', expenseData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  // Add more expense-related API calls here


  
};

export const fetchQuickBooksPayments = async () => {
  return await axios.get(`${API_BASE_URL}/quickbooks/payments`);
};

// Fetch approved expenses for payment processing
export const fetchApprovedExpenses = async () => {
  return await axios.get(`${API_BASE_URL}/payments`);
};

// Process payments
export const processPayments = async () => {
  return await axios.post(`${API_BASE_URL}/payments/process`);
};


export default api;