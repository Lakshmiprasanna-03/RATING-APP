import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChangePassword from './pages/ChangePassword';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminStores from './pages/admin/Stores';

// Store Owner pages
import StoreOwnerDashboard from './pages/store-owner/Dashboard';

// User pages
import UserStores from './pages/user/Stores';
import UserRatings from './pages/user/Ratings';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes for all authenticated users */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stores"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminStores />
              </ProtectedRoute>
            }
          />

          {/* Store Owner routes */}
          <Route
            path="/store-owner/dashboard"
            element={
              <ProtectedRoute roles={['storeOwner']}>
                <StoreOwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* User routes */}
          <Route
            path="/user/stores"
            element={
              <ProtectedRoute roles={['user']}>
                <UserStores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/ratings"
            element={
              <ProtectedRoute roles={['user']}>
                <UserRatings />
              </ProtectedRoute>
            }
          />

          {/* Default route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {({ user }) => {
                  switch (user?.role) {
                    case 'admin':
                      return <Navigate to="/admin/dashboard" replace />;
                    case 'storeOwner':
                      return <Navigate to="/store-owner/dashboard" replace />;
                    case 'user':
                      return <Navigate to="/user/stores" replace />;
                    default:
                      return <Navigate to="/login" replace />;
                  }
                }}
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
