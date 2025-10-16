import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BLOOM_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // Add auth token from sessionStorage if available
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Optionally trigger logout or token refresh
    }
    return Promise.reject(error);
  }
);

export default api;
