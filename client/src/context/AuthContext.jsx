import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

      socket.on('contact_info_received', (data) => {
        toast(
          (t) => (
            <div className="text-sm">
              <p className="font-bold">{data.message}</p>
              {data.details.phone && <p><strong>Phone:</strong> {data.details.phone}</p>}
              {data.details.note && <p><strong>Note:</strong> {data.details.note}</p>}
              <button onClick={() => toast.dismiss(t.id)} className="w-full mt-2 px-4 py-1 text-xs bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">
                Dismiss
              </button>
            </div>
          ),
          { duration: 10000 }
        );
      });

      return () => socket.disconnect();
    }
  }, [isAuthenticated, user]);

  const login = useCallback(async (credentials) => {
    if (credentials.user) {
      setUser(credentials.user);
      setIsAuthenticated(true);
      if (credentials.accessToken) {
        localStorage.setItem('accessToken', credentials.accessToken);
        setToken(credentials.accessToken);
      }
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
      const meResponse = await apiClient.get('/users/me');
      setBookmarks(meResponse.data.data.bookmarks || []);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  }, [navigate]);

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

  const markUserAsWelcomedInState = useCallback(() => {
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, welcomed: true };
    });
  }, []);

  const authContextValue = {
    user,
    token,
    isAuthenticated,
    loading,
    bookmarks,
    toggleBookmark,
    login,
    logout,
    markUserAsWelcomedInState,
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