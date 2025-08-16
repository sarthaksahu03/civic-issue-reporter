import React from 'react';
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

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <Router>
        {isAuthenticated && <Header />}
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
      </Router>
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