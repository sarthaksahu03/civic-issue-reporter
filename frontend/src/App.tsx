import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GrievanceProvider } from './contexts/GrievanceContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import CitizenDashboard from './components/Dashboard/CitizenDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import ReportForm from './components/Grievance/ReportForm';
import ComplaintsList from './components/Grievance/ComplaintsList';
import UserSettings from './components/Settings/UserSettings';
import ProtectedRoute from './components/Common/ProtectedRoute';
import NotificationsPage from './components/Notifications/NotificationsPage';
import Footer from './components/Layout/Footer';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Optional: Set system dark mode as default
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark transition-colors flex flex-col">
      <Router>
        {isAuthenticated && <Header />}
        <div className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterForm />} 
          />
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                {user?.role === 'admin' ? <AdminDashboard /> : <CitizenDashboard />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report" 
            element={
              <ProtectedRoute>
                <ReportForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-complaints" 
            element={
              <ProtectedRoute>
                <ComplaintsList />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            } 
          />
        </Routes>
        </div>
      </Router>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <GrievanceProvider>
          <AppContent />
        </GrievanceProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;