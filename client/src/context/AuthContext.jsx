import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify'; 
import apiClient from '../api/axios';
import { subscribeUserToPush } from '../push-notifications'; // 👈 New import

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const savedMessages = sessionStorage.getItem('chatMessages');
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      return [];
    }
  });
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState(null);
  const navigate = useNavigate();

  const clearUnreadNotifications = useCallback(() => {
    setTotalUnreadCount(0);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await apiClient.get('/messages/conversations');
      const conversations = response.data.data;
      const unreadCount = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
      setTotalUnreadCount(unreadCount);
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/users/me');
          setUser(response.data.data);
          setBookmarks(response.data.data.bookmarks || []);
          setIsAuthenticated(true);
          fetchUnreadCount();
        } catch (error) {
          localStorage.removeItem('accessToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUserStatus();
  }, [token, fetchUnreadCount]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = io(import.meta.env.VITE_API_BASE_URL.replace("/api/v1", ""));
      socket.emit('join_room', user._id);

      socket.off('new_notification');
      socket.on('new_notification', (data) => {
        toast.success(data.message);
      });

      socket.off('new_badge_earned');
    
      socket.off('newMessage');
      socket.on('newMessage', () => {
        fetchUnreadCount();
      });

      return () => {
        socket.off('new_notification');
        socket.off('newMessage');
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, fetchUnreadCount]);

  

  const login = useCallback(async (credentials) => {
    try {
      const response = await apiClient.post('/users/login', credentials);
      const { user: userData, accessToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);

      // --- NEW: Subscribe to push notifications on login ---
      subscribeUserToPush();

      navigate('/');
    } catch (error) {
      throw error;
    }
  }, [navigate]);

  const setTokenAndUser = useCallback(async (accessToken) => {
    try {
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      const response = await apiClient.get('/users/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setUser(response.data.data);
      setIsAuthenticated(true);
    } catch (error) {
      logout();
    }
  }, []);

  const updateUserState = useCallback((newUserData) => {
    setUser(currentUser => ({ ...currentUser, ...newUserData }));
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
      setChatMessages([]);
      sessionStorage.removeItem('chatMessages');
      setTotalUnreadCount(0);
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

  const updateChatMessages = useCallback((newMessages) => {
    const updater = typeof newMessages === 'function' ? newMessages : () => newMessages;
    setChatMessages(prevMessages => {
      const updated = updater(prevMessages);
      sessionStorage.setItem('chatMessages', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    bookmarks,
    login,
    logout,
    toggleBookmark,
    updateUserState,
    chatMessages,
    updateChatMessages,
    totalUnreadCount,
    fetchUnreadCount,
    clearUnreadNotifications,
    setTokenAndUser,
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
