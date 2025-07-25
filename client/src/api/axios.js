import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  withCredentials: true
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response, // Directly return successful responses
  (error) => {
    // Check for network errors (server is down, no internet, etc.)
    if (error.code === "ERR_NETWORK") {
      toast.error("Network Error: Please check your internet connection or try again later.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;