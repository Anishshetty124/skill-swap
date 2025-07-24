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
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
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
          setUser(null);
          setIsAuthenticated(false);
          setToken(null);
          setBookmarks([]);
          localStorage.removeItem('accessToken');
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
      socket.on('new_notification', (data) => {
        toast.success(data.message, { duration: 5000 });
      });
      return () => socket.disconnect();
    }
  }, [isAuthenticated, user]);

  const login = async (credentials) => {
    if (credentials.user) {
      setUser(credentials.user);
      setIsAuthenticated(true); // Ensure auth state is true
      if (credentials.accessToken) {
        localStorage.setItem('accessToken', credentials.accessToken);
        setToken(credentials.accessToken);
      }
      // Also update bookmarks if they are part of the user object
      setBookmarks(credentials.user.bookmarks || []);
      return;
    }

    try {
      const response = await apiClient.post('/users/login', credentials);
      const { user: userData, accessToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Fetch user data again to get bookmarks
      const meResponse = await apiClient.get('/users/me');
      setBookmarks(meResponse.data.data.bookmarks || []);
      
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
      setBookmarks([]);
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };
  
  const toggleBookmark = async (skillId) => {
    const isBookmarked = bookmarks.includes(skillId);
    
    // Optimistic UI update
    const originalBookmarks = bookmarks;
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
      // Revert on error
      setBookmarks(originalBookmarks); 
    }
  };

  const authContextValue = {
    user,
    token,
    isAuthenticated,
    loading,
    bookmarks,
    toggleBookmark,
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