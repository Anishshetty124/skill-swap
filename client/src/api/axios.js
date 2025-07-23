import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  withCredentials: true // Important: Allows sending cookies with requests
});

// --- Interceptor to Add Auth Token ---
// This function runs before every request is sent from your app
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from the browser's localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      // If the token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;