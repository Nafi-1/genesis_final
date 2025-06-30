import React from 'react';
import { BrowserRouter, RouterProvider, Navigate, createBrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthForm } from './components/auth/AuthForm';
import GoogleAuthCallback from './components/auth/GoogleAuthCallback';
import { useAuthStore } from './stores/authStore';

// Protected route wrapper
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuthStore();
  
  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{element}</>;
};

// Public route that redirects to home if logged in
const PublicRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{element}</>;
};

// Create router
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/auth',
    element: <PublicRoute element={<AuthForm onBack={() => window.location.href = '/'} />} />
  },
  {
    path: '/auth/callback',
    element: <GoogleAuthCallback />
  }
]);

export const Router: React.FC = () => {
  return <RouterProvider router={router} />;
};