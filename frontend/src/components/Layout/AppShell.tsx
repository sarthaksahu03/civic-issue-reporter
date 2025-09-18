import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Menu, X, LogOut, User as UserIcon, Settings, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const AppShell: React.FC<{ children: React.ReactNode } > = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true); // desktop toggle
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setSidebarOpen(false); setProfileOpen(false); }, [location.pathname]);
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
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navItems = (() => {
    const base = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/settings', label: 'Settings' },
    ];
    if (user?.role === 'admin') {
      // Order for admin: Admin Dashboard, Admin Grievances, Admin Feedbacks, then Notifications
      const notifications = base.find(i => i.to === '/notifications')!;
      return [
        { to: '/admin', label: 'Admin Dashboard' },
        { to: '/admin/grievances', label: 'Admin: Grievances' },
        { to: '/admin/feedbacks', label: 'Admin: Feedbacks' },
        notifications,
      ];
    }
    return [
      ...base,
      { to: '/report', label: 'Report' },
      { to: '/my-complaints', label: 'My Complaints' },
      { to: '/city-updates', label: 'City Updates' },
      { to: '/transparency', label: 'Transparency' },
    ];
  })();

  const handleEmergency = async () => {
    try {
      let coords: { latitude?: number; longitude?: number } = {};
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => { coords = { latitude: p.coords.latitude, longitude: p.coords.longitude }; resolve(); },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      }
      const desc = window.prompt('Briefly describe the emergency (e.g., accident, hazard):') || '';
      const res = await api.reportEmergency({
        title: 'Emergency Report',
        description: desc,
        category: 'emergency',
        location: '',
        userId: user?.id,
        ...coords,
      });
      if (res.success) {
        alert('Emergency reported. Authorities have been alerted.');
        navigate('/dashboard');
      } else {
        alert('Failed to report emergency: ' + (res as any).error);
      }
    } catch (e) {
      alert('Failed to report emergency.');
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Skip to content for keyboard navigation */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-primary text-white px-3 py-2 rounded-md">Skip to main content</a>
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button aria-label="Open menu" onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Menu className="h-5 w-5"/></button>
            <Link to="/dashboard" className="font-bold tracking-tight text-primary dark:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary rounded-sm">CivicEye</Link>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDarkMode(d => !d)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{darkMode ? '🌙' : '☀️'}</button>
            <Link to="/notifications" className="hidden md:inline p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Notifications"><Bell className="h-5 w-5"/></Link>
            {/* Desktop sidebar toggle */}
            <button onClick={() => setSidebarVisible(v => !v)} className="hidden md:inline p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Toggle sidebar">
              {sidebarVisible ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
            </button>
            {isAuthenticated && (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(o => !o)} className="flex items-center gap-2 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                  <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}`} alt="Profile" className="w-8 h-8 rounded-full"/>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow-md py-1 will-change-transform transition-transform duration-150 ease-out">
                    <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"><Settings className="h-4 w-4"/> Settings</button>
                    <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"><UserIcon className="h-4 w-4"/> Profile</button>
                    <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"><LogOut className="h-4 w-4"/> Logout</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar (fixed, full-height under header) */}
      {/* Mobile overlay */}
      <div className={`${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} md:hidden fixed inset-0 z-30 bg-black/40 transition-opacity`} onClick={() => setSidebarOpen(false)} />

      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarVisible ? 'md:translate-x-0' : 'md:-translate-x-full'} fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-72 z-40 md:z-10 bg-surface dark:bg-surface-dark border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out will-change-transform`}
        aria-label="Sidebar navigation"
      >
        <div className="h-14 px-2 flex items-center gap-2 md:hidden border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="h-5 w-5"/></button>
          <span className="font-semibold">Menu</span>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-3.5rem)] md:h-full pb-24 relative">
          {navItems.filter(i => i.to !== '/settings').map(item => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={location.pathname === item.to ? 'page' : undefined}
              className={`block px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${location.pathname === item.to ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {item.label}
            </Link>
          ))}
          {/* Settings moved just above Emergency button */}
          <Link
            to="/settings"
            aria-current={location.pathname === '/settings' ? 'page' : undefined}
            className={`absolute left-4 right-4 bottom-16 block px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${location.pathname === '/settings' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            Settings
          </Link>
          {/* Emergency button pinned to bottom */}
          <button
            onClick={handleEmergency}
            className="absolute left-4 right-4 bottom-4 inline-flex items-center justify-center gap-2 bg-[rgb(255,105,105)] hover:bg-[rgb(235,85,85)] text-white px-4 py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-[rgb(255,105,105)]"
          >
            <ShieldAlert className="h-5 w-5" /> Emergency Report
          </button>
        </nav>
      </aside>

      {/* Main content (scrollable only here) */}
      <main id="main-content" className={`pt-14 ${sidebarVisible ? 'md:pl-72' : 'md:pl-0'} h-[calc(100vh-3.5rem)] overflow-y-auto transition-[padding] duration-300 ease-in-out`}>
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
