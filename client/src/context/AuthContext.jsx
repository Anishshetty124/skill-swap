import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/users/me');
          setUser(response.data.data);
          setIsAuthenticated(true);
        } catch (error) {
          setUser(null);
          setIsAuthenticated(false);
          setToken(null);
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };
    checkUserStatus();
  }, [token]);

  const login = async (credentials) => {
    // This part updates user state after a profile edit
    if (credentials.user) {
      setUser(credentials.user);
      if (credentials.accessToken) {
        localStorage.setItem('accessToken', credentials.accessToken);
        setToken(credentials.accessToken);
      }
      return;
    }
    // Standard login flow
    try {
      const response = await apiClient.post('/users/login', credentials);
      const { user: userData, accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
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
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };
  
  const authContextValue = { user, token, isAuthenticated, loading, login, logout };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};