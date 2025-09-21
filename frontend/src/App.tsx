import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GrievanceProvider } from './contexts/GrievanceContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './contexts/AuthContext';
import AppShell from './components/Layout/AppShell';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import CitizenDashboard from './components/Dashboard/CitizenDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import TransparencyPage from './components/Dashboard/TransparencyPage';
import ReportForm from './components/Grievance/ReportForm';
import ComplaintsList from './components/Grievance/ComplaintsList';
import UserSettings from './components/Settings/UserSettings';
import ProtectedRoute from './components/Common/ProtectedRoute';
import NotificationsPage from './components/Notifications/NotificationsPage';
import Footer from './components/Layout/Footer';
import PublicLayout from './components/Layout/PublicLayout';
import AdminGrievances from './components/Dashboard/AdminGrievances';
import AdminFeedbacks from './components/Dashboard/AdminFeedbacks';
import ProfilePage from './components/Settings/ProfilePage';
import CityUpdates from './components/Dashboard/CityUpdates';
import Gallery from './components/Dashboard/Gallery';
import GrievanceDetail from './components/Grievance/GrievanceDetail';
import FAQ from './components/Static/FAQ';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Apply persisted Theme & Accessibility preferences on load
  useEffect(() => {
    const applyAppearance = () => {
      try {
        const theme = localStorage.getItem('app_theme') || 'system'; // 'light' | 'dark' | 'system'
        const fontScale = localStorage.getItem('app_font_scale') || 'normal'; // 'normal' | 'large'
        const highContrast = localStorage.getItem('app_high_contrast') === 'true';

        // Theme
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', shouldDark);

        // Font scale
        document.documentElement.classList.toggle('a11y-font-large', fontScale === 'large');

        // High contrast
        document.documentElement.classList.toggle('a11y-contrast', highContrast);
      } catch {}
    };
    applyAppearance();
    // Listen for system theme changes when using 'system' theme
    const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const onChange = () => {
      try {
        const theme = localStorage.getItem('app_theme') || 'system';
        if (theme === 'system') {
          const prefersDark = mql ? mql.matches : false;
          document.documentElement.classList.toggle('dark', prefersDark);
        }
      } catch {}
    };
    if (mql) {
      mql.addEventListener?.('change', onChange);
    }
    return () => {
      if (mql) {
        mql.removeEventListener?.('change', onChange);
      }
    };
  }, []);

  // After OAuth or any login, redirect to intended path or dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      try {
        const stored = localStorage.getItem('postLoginRedirect');
        if (stored) {
          localStorage.removeItem('postLoginRedirect');
          navigate(stored, { replace: true });
          return;
        }
      } catch {}
      // Only auto-redirect to dashboard when user is on a public page
      if (['/login', '/', '/register'].includes(location.pathname)) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark transition-colors flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-600 dark:text-slate-300">Loading...</span>
          </div>
        ) : isAuthenticated ? (
          <AppShell>
            <Routes>
              {/* Protected Routes inside AppShell */}
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
                path="/grievances/:id"
                element={
                  <ProtectedRoute>
                    <GrievanceDetail />
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
                path="/transparency"
                element={
                  <ProtectedRoute>
                    <TransparencyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gallery"
                element={
                  <ProtectedRoute>
                    <Gallery />
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
                path="/city-updates"
                element={
                  <ProtectedRoute>
                    <CityUpdates />
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
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
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
              <Route 
                path="/admin/grievances" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminGrievances />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/admin/feedbacks"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminFeedbacks />
                  </ProtectedRoute>
                }
              />
              {/* Default redirect when authenticated */}
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
              <Route
                path="/faq"
                element={<FAQ />}
              />
            </Routes>
          </AppShell>
        ) : (
          <PublicLayout>
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
              <Route 
                path="/" 
                element={<Navigate to="/login" replace />} 
              />
              <Route
                path="/faq"
                element={<FAQ />}
              />
              {/* Fallback for any other path while unauthenticated */}
              <Route 
                path="*" 
                element={<Navigate to="/login" replace />} 
              />
            </Routes>
          </PublicLayout>
        )}
        {isAuthenticated && <Footer withSidebarPadding />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <GrievanceProvider>
          <Router>
            <AppContent />
          </Router>
        </GrievanceProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;