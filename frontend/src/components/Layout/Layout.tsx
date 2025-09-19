import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-slate-800 dark:text-slate-100">
      {children}
    </div>
  );
};

export default Layout;
