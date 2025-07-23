import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true // Important: Allows sending cookies with requests
});

export default apiClient;