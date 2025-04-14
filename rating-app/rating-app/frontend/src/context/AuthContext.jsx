import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext(null);

// Helper functions for localStorage
const saveUserData = (token, userData) => {
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

const getSavedUserData = () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      return { token, user };
    }
    return null;
  } catch (error) {
    console.error('Error getting saved user data:', error);
    return null;
  }
};

const clearUserData = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to check token and fetch user data
  const checkAuth = async () => {
    const savedData = getSavedUserData();
    if (!savedData) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // First set the saved user data
      setUser(savedData.user);
      
      // Then verify with backend
      const response = await authService.getCurrentUser();
      setUser(response.user);
      saveUserData(savedData.token, response.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      if (error.response?.status === 401) {
        clearUserData();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check auth status when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  const signup = async (userData) => {
    try {
      const { token, user: newUser } = await authService.signup(userData);
      saveUserData(token, newUser);
      setUser(newUser);

      // Redirect based on user role
      if (newUser.role === 'storeOwner') {
        navigate('/store-owner/dashboard');
      } else {
        navigate('/user/stores');
      }
      
      return { token, user: newUser };
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const { token, user: userData } = await authService.login(email, password);
      saveUserData(token, userData);
      setUser(userData);

      // Redirect based on user role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'storeOwner') {
        navigate('/store-owner/dashboard');
      } else {
        navigate('/user/stores');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    clearUserData();
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
