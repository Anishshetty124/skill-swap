import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify'; 
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/users/me');
          setUser(response.data.data);
          setBookmarks(response.data.data.bookmarks || []);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('accessToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUserStatus();
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = io(import.meta.env.VITE_API_BASE_URL.replace("/api/v1", ""));
      socket.emit('join_room', user._id);
      
      socket.off('new_notification');
      socket.on('new_notification', (data) => {
        toast.success(data.message);
      });

      return () => {
        socket.off('new_notification');
        socket.disconnect();
      }
    }
  }, [isAuthenticated, user]);

  const login = useCallback(async (credentials) => {
    try {
      const response = await apiClient.post('/users/login', credentials);
      const { user: userData, accessToken } = response.data.data;

      if (userData.isFirstLogin) {
        setShowWelcomeModal(true);
      }

      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      throw error;
    }
  }, [navigate]);
  
  const updateUserState = useCallback((newUserData) => {
    setUser(currentUser => ({...currentUser, ...newUserData}));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/users/logout');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setBookmarks([]);
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  }, [navigate]);
  
  const toggleBookmark = useCallback(async (skillId) => {
    const originalBookmarks = [...bookmarks];
    const isBookmarked = originalBookmarks.includes(skillId);
    
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(id => id !== skillId));
    } else {
      setBookmarks(prev => [...prev, skillId]);
    }
    try {
      if (isBookmarked) {
        await apiClient.delete(`/skills/${skillId}/bookmark`);
      } else {
        await apiClient.post(`/skills/${skillId}/bookmark`);
      }
    } catch (error) {
      toast.error("Failed to update bookmark.");
      setBookmarks(originalBookmarks); 
    }
  }, [bookmarks]);

  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    bookmarks,
    login,
    logout,
    toggleBookmark,
    updateUserState,
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
