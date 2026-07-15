import axios from 'axios';

const DEFAULT_API_URL = 'https://dodosystem-api.duckdns.org';

// Production uses the hosted API by default. Developers can still point the
// frontend at another backend by setting VITE_API_URL in a local env file.
export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dodo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dodo_token');
      localStorage.removeItem('dodo_refreshToken');
      localStorage.removeItem('dodo_user');
      localStorage.removeItem('dodo_tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
