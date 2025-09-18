import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-slate-200 dark:border-slate-700 bg-surface/60 dark:bg-surface-dark/60">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between text-sm md:pl-72 transition-[padding] duration-300 ease-in-out">
        <p className="text-slate-600 dark:text-slate-300">© {year} CivicEye. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          <Link className="text-slate-600 dark:text-slate-300 hover:text-primary" to="/dashboard">Dashboard</Link>
          <Link className="text-slate-600 dark:text-slate-300 hover:text-primary" to="/report">Report</Link>
          <Link className="text-slate-600 dark:text-slate-300 hover:text-primary" to="/my-complaints">My Complaints</Link>
          <Link className="text-slate-600 dark:text-slate-300 hover:text-primary" to="/settings">Settings</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
