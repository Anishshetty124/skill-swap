import axios from 'axios';
import { toast } from 'react-toastify';

let isNetworkErrorToastVisible = false;

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK" && !isNetworkErrorToastVisible) {
      isNetworkErrorToastVisible = true;
      toast.error("Network Error: Please check your internet connection.");
      
      setTimeout(() => {
        isNetworkErrorToastVisible = false;
      }, 5000);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
