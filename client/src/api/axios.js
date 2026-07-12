import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vardhman_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const onAuthPage = ['/login', '/register', '/reset-password'].some(p =>
        window.location.pathname.startsWith(p)
      );
      // Only redirect if NOT already on a public auth page
      // (otherwise the page reload kills the error toast on login failures)
      if (!onAuthPage) {
        localStorage.removeItem('vardhman_token');
        localStorage.removeItem('vardhman_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
