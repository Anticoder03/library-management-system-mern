import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export const UPLOAD_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const response = error.response;
    const message =
      response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : null) ||
      (!response ? 'Cannot connect to the server. Check your connection and try again.' : 'Something went wrong');

    if (response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('sl_token');
      localStorage.removeItem('sl_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return Promise.reject({
      message,
      errors: response?.data?.errors || [],
      status: response?.status || 0,
    });
  }
);

export const getImageUrl = (path) => {
  if (!path) return '';
  if (/^(https?:\/\/|blob:|data:)/.test(path)) return path;
  return `${UPLOAD_BASE}${path}`;
};

export const downloadFile = async (url, filename) => {
  const token = localStorage.getItem('sl_token');
  const response = await axios.get(`${API_BASE}${url}`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
  });
  const objectUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};

export default api;
