import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      // The interceptor in axios.js will automatically add the token to this request
      try {
        const response = await apiClient.get('/users/me');
        setUser(response.data.data);
        setIsAuthenticated(true);
      } catch (error) {
        // If the token is invalid, clear it
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };
    // Only run check if a token exists
    if (localStorage.getItem('accessToken')) {
      checkUserStatus();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = io(import.meta.env.VITE_API_BASE_URL.replace("/api/v1", ""));
      socket.emit('join_room', user._id);
      socket.on('new_notification', (data) => {
        toast.success(data.message, { duration: 5000 });
      });
      return () => socket.disconnect();
    }
  }, [isAuthenticated, user]);

  const login = async (credentials) => {
    if (credentials.user && !credentials.password) {
      setUser(credentials.user);
      setIsAuthenticated(true);
      return;
    }

    try {
      const response = await apiClient.post('/users/login', credentials);
      const { user: userData, accessToken } = response.data.data;
      
      // Save token to localStorage to persist session
      localStorage.setItem('accessToken', accessToken);
      
      setUser(userData);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/users/logout');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear user state and remove token from localStorage
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };
  
  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};