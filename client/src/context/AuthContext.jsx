import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import apiClient from '../api/axios';
import { subscribeUserToPush } from '../push-notifications';
import Spinner from '../components/common/Spinner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const savedMessages = sessionStorage.getItem('chatMessages');
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch {
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
      const unreadCount = conversations.reduce(
        (acc, conv) => acc + (conv.unreadCount || 0),
        0
      );
      setTotalUnreadCount(unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (token && !user) {
        try {
          const response = await apiClient.get('/users/me');
          setUser(response.data.data);
          setBookmarks(response.data.data.bookmarks || []);
          setIsAuthenticated(true);
          fetchUnreadCount();
        } catch {
          localStorage.removeItem('accessToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUserStatus();
  }, [token, user, fetchUnreadCount]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = io(import.meta.env.VITE_API_BASE_URL.replace('/api/v1', ''));
      socket.emit('join_room', user._id);

      socket.on('new_notification', (data) => toast.success(data.message));
      socket.on('new_badge_earned', (badge) => setNewlyEarnedBadge(badge));
      socket.on('newMessage', () => fetchUnreadCount());

      return () => {
        socket.off('new_notification');
        socket.off('new_badge_earned');
        socket.off('newMessage');
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, fetchUnreadCount]);

  const login = useCallback(
    async (credentials) => {
      try {
        const response = await apiClient.post('/users/login', credentials);
        const { user: userData, accessToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        setToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
        subscribeUserToPush();
        navigate('/');
      } catch (error) {
        throw error;
      }
    },
    [navigate]
  );

  const setTokenAndUser = useCallback(
    async (accessToken) => {
      setIsLoggingIn(true);
      try {
        localStorage.setItem('accessToken', accessToken);
        setToken(accessToken);
        const response = await apiClient.get('/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(response.data.data);
        setIsAuthenticated(true);

        setTimeout(() => {
          navigate('/');
          setIsLoggingIn(false);
        }, 1000);
      } catch {
        setIsLoggingIn(false);
        logout();
      }
    },
    [navigate]
  );

  const updateUserState = useCallback((newUserData) => {
    setUser((currentUser) => ({ ...currentUser, ...newUserData }));
  }, []);

  const logout = useCallback(
    async (shouldNavigate = true) => {
      try {
        await apiClient.post('/users/logout');
      } catch (error) {
        console.error('Logout API call failed:', error);
      } finally {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setBookmarks([]);
        setChatMessages([]);
        setTotalUnreadCount(0);
        sessionStorage.removeItem('chatMessages');
        localStorage.removeItem('accessToken');
        if (window.google) {
          window.google.accounts.id.disableAutoSelect();
        }
        if (shouldNavigate) {
          navigate('/login');
        }
      }
    },
    [navigate]
  );

  const toggleBookmark = useCallback(
    async (skillId) => {
      const originalBookmarks = [...bookmarks];
      const isBookmarked = originalBookmarks.includes(skillId);

      if (isBookmarked) {
        setBookmarks((prev) => prev.filter((id) => id !== skillId));
      } else {
        setBookmarks((prev) => [...prev, skillId]);
      }
      try {
        if (isBookmarked) {
          await apiClient.delete(`/skills/${skillId}/bookmark`);
        } else {
          await apiClient.post(`/skills/${skillId}/bookmark`);
        }
      } catch {
        toast.error('Failed to update bookmark.');
        setBookmarks(originalBookmarks);
      }
    },
    [bookmarks]
  );

  const updateChatMessages = useCallback((newMessages) => {
    const updater =
      typeof newMessages === 'function' ? newMessages : () => newMessages;
    setChatMessages((prevMessages) => {
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
    newlyEarnedBadge,
  };

  if (isLoggingIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
        <Spinner text="Logging in..." />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
