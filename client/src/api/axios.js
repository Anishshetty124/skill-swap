import axios from 'axios';
import toast from 'react-hot-toast';

// Flag to track if the network error toast is already visible
let isNetworkErrorToastVisible = false;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  withCredentials: true
});

// Interceptor to add the auth token to every request
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

// Interceptor to handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for network errors and ensure the toast is not already visible
    if (error.code === "ERR_NETWORK" && !isNetworkErrorToastVisible) {
      isNetworkErrorToastVisible = true;
      toast.error("Network Error: Please check your internet connection.");
      
      // Reset the flag after 5 seconds to allow a new message if needed
      setTimeout(() => {
        isNetworkErrorToastVisible = false;
      }, 5000);
    }
    return Promise.reject(error);
  }
);

export default apiClient;