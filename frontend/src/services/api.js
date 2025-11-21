import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Service functions
export const authService = {
  signup: (username, email, password) =>
    api.post('/api/auth/signup', { username, email, password }),
  
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
};

export const emailService = {
  getEmails: () => api.get('/api/emails'),
  
  setupImap: (email, password) =>
    api.post('/api/imap/setup', { email, password }),
  
  syncEmails: () => api.post('/api/imap/sync'),
};

export const notificationService = {
  getNotifications: () => api.get('/api/notifications'),
};
