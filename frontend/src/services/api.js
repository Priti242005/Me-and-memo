import axios from 'axios';

export const API_BASE_URL =
  (
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:5000'
  ).replace(/\/$/, '');

// Backend is mounted under `/api` (Express `app.use('/api/*', ...)`).
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT from localStorage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (!config.headers) {
    config.headers = {};
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
