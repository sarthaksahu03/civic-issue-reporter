import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
// Public layout shows a simple header with theme toggle and a sticky footer

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Initialize dark mode from localStorage or system preference
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-background-dark">
      <header className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="font-bold tracking-tight text-primary dark:text-primary-dark">CivicEye</div>
          <Link to="/faq" className="hidden sm:inline px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">FAQ</Link>
        </div>
        <button
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setDarkMode(d => !d)}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
      <Footer withSidebarPadding={false} />
    </div>
  );
};

export default PublicLayout;
