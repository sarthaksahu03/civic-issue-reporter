import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-slate-200 dark:border-slate-700 bg-surface/60 dark:bg-surface-dark/60">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between text-sm">
        <p className="text-slate-600 dark:text-slate-300">© {year} Civic Reporter. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          <a className="text-slate-600 dark:text-slate-300 hover:text-primary" href="/dashboard">Dashboard</a>
          <a className="text-slate-600 dark:text-slate-300 hover:text-primary" href="/report">Report</a>
          <a className="text-slate-600 dark:text-slate-300 hover:text-primary" href="/my-complaints">My Complaints</a>
          <a className="text-slate-600 dark:text-slate-300 hover:text-primary" href="/settings">Settings</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
