import React from 'react';
import PWAInstallPrompt from '../PWA/PWAInstallPrompt';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-slate-800 dark:text-slate-100">
      {children}
      <PWAInstallPrompt />
    </div>
  );
};

export default Layout;
