import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { User, Bell, Menu, X, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationPanel from '../Notifications/NotificationPanel';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PGR</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Grievance Reporter
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-700 hover:text-sky-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              Dashboard
            </button>
            {user?.role === 'citizen' && (
              <>
                <button
                  onClick={() => navigate('/report')}
                  className="text-gray-700 hover:text-sky-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Report Issue
                </button>
                <button
                  onClick={() => navigate('/my-complaints')}
                  className="text-gray-700 hover:text-sky-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  My Complaints
                </button>
              </>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-700 hover:text-sky-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Admin Panel
              </button>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsNotificationOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:block font-medium">{user?.name}</span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigate('/settings');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => {
                navigate('/dashboard');
                setIsMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:text-sky-600 font-medium"
            >
              Dashboard
            </button>
            {user?.role === 'citizen' && (
              <>
                <button
                  onClick={() => {
                    navigate('/report');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-sky-600 font-medium"
                >
                  Report Issue
                </button>
                <button
                  onClick={() => {
                    navigate('/my-complaints');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-sky-600 font-medium"
                >
                  My Complaints
                </button>
              </>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  navigate('/admin');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-sky-600 font-medium"
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </header>
  );
};

export default Header;