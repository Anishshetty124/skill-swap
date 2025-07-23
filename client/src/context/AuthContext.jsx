import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';

// Create the context to hold our authentication state
const AuthContext = createContext(null);

// Create the Provider component that will wrap our application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  // This effect runs once when the app starts to check if the user is already logged in
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // We can call the /me endpoint which is protected. 
        // If it succeeds, the user has a valid token.
        const response = await apiClient.get('/users/me');
        setUser(response.data.data);
        setIsAuthenticated(true);
      } catch (error) {
        // If it fails, it means no valid token, so user is not logged in.
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Stop loading once check is complete
      }
    };
    checkUserStatus();
  }, []);

  // Function to handle login OR update the user state
  const login = async (credentials) => {
    // --- THIS IS THE NEW LOGIC ---
    // If we pass a user object directly (from profile edit), just update the state.
    // This avoids forcing a re-login after a profile update.
    if (credentials.user && !credentials.password) {
      setUser(credentials.user);
      setIsAuthenticated(true);
      return;
    }
    // --- END OF NEW LOGIC ---

    // This is the original login logic for handling email/password
    try {
      const response = await apiClient.post('/users/login', credentials);
      const { user: userData, accessToken } = response.data.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      navigate('/dashboard');
    } catch (error) {
      // Re-throw the error so the login form can catch and display it
      throw error;
    }
  };

  // Function to handle logout
  const logout = async () => {
    try {
      await apiClient.post('/users/logout');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };
  
  // The value that will be available to all children components
  const authContextValue = {
    user,
    isAuthenticated,
    loading, // Expose loading state
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children} {/* Don't render children until the initial auth check is done */}
    </AuthContext.Provider>
  );
};

// A custom hook to make it easier to use the context
export const useAuth = () => {
  return useContext(AuthContext);
};