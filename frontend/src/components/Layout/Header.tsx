import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="bg-surface dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-primary dark:text-primary-dark font-bold text-lg tracking-tight focus:outline-none focus:ring-2 focus:ring-primary rounded-md">
          CivicEye
        </Link>
      </div>
      <nav className="flex items-center gap-2 md:gap-4">
        <button
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setDarkMode((d) => !d)}
          className="px-2 py-2 rounded-md bg-background dark:bg-background-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {darkMode ? (
            <span aria-hidden="true">🌙</span>
          ) : (
            <span aria-hidden="true">☀️</span>
          )}
        </button>
        {isAuthenticated && (
          <>
            <Link to="/dashboard" className="hidden md:inline px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary">Dashboard</Link>
            <Link to="/report" className="hidden md:inline px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary">Report</Link>
            <Link to="/my-complaints" className="hidden md:inline px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary">My Complaints</Link>
            <Link to="/notifications" className="hidden md:inline px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary">Notifications</Link>
            <Link to="/settings" className="hidden md:inline px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary">Settings</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="hidden md:inline px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary">Admin</Link>
            )}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="ml-2 px-3 py-2 rounded-md bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >Logout</button>
          </>
        )}
        {!isAuthenticated && (
          <>
            <Link to="/login" className="px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary">Login</Link>
            <Link to="/register" className="px-3 py-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;