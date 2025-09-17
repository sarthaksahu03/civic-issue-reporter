import React, { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardList, Bell, Settings as SettingsIcon, Info, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { apiService } from '../../services/api';

const dashboardOptions = [
  {
    title: 'Report New Grievance',
    description: 'Submit a new issue you have encountered in your area.',
    icon: <AlertTriangle className="h-7 w-7 text-primary" />,
    link: '/report',
    button: 'Report Now',
  },
  {
    title: 'My Complaints',
    description: 'View and track the status of your submitted grievances.',
    icon: <ClipboardList className="h-7 w-7 text-primary" />,
    link: '/my-complaints',
    button: 'View Complaints',
  },
  {
    title: 'Notifications',
    description: 'Check important updates and alerts from the city.',
    icon: <Bell className="h-7 w-7 text-primary" />,
    link: '/notifications',
    button: 'View Notifications',
  },
  {
    title: 'Settings',
    description: 'Manage your profile and notification preferences.',
    icon: <SettingsIcon className="h-7 w-7 text-primary" />,
    link: '/settings',
    button: 'Account Settings',
  },
  {
    title: 'City Updates',
    description: 'See the latest news and updates from your municipality.',
    icon: <Info className="h-7 w-7 text-primary" />,
    link: '/city-updates',
    button: 'See Updates',
  },
];

type UserStats = {
  totalGrievances: number;
  pendingGrievances: number;
  inProgressGrievances: number;
  resolvedGrievances: number;
  rejectedGrievances: number;
};

const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          apiService.getDashboardStats(user?.id),
          apiService.getRecentGrievances(user?.id, 5),
        ]);
        if (!isMounted) return;
        if (statsRes.success && (statsRes.data as any)?.stats) setStats((statsRes.data as any).stats);
        if (recentRes.success && (recentRes.data as any)?.grievances) setRecent((recentRes.data as any).grievances);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
          <a href="/report" className="bg-primary text-white rounded-md px-4 py-2 font-medium hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90">Report Issue</a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && (
            <div className="col-span-4 flex items-center justify-center p-6 bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading your stats...
            </div>
          )}
          {!loading && stats && (
            <>
              <StatCard label="Total" value={stats.totalGrievances} variant="slate" />
              <StatCard label="Pending" value={stats.pendingGrievances} variant="amber" />
              <StatCard label="In Progress" value={stats.inProgressGrievances} variant="sky" />
              <StatCard label="Resolved" value={stats.resolvedGrievances} variant="emerald" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Recent grievances */}
          <div className="lg:col-span-2 bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6 h-full min-h-[340px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Grievances</h2>
              <a href="/my-complaints" className="text-primary">View all</a>
            </div>
            <div className="space-y-3 flex-1">
              {recent.length === 0 && <p className="text-slate-500">No recent grievances.</p>}
              {recent.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-2 border-b last:border-b-0 border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{g.title}</p>
                    <p className="text-sm text-slate-500">{new Date(g.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 capitalize">{String(g.status).replace('_','-')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6 h-full min-h-[340px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Notifications</h2>
              <a href="/notifications" className="text-primary">See all</a>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-slate-600 dark:text-slate-300">Unread</p>
                <span className="text-sm font-semibold">{unreadCount}</span>
              </div>
              {notifications.slice(0, 3).map(n => (
                <div key={n.id} className="p-3 rounded-md bg-slate-50 dark:bg-slate-800">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-slate-500">You're all caught up!</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardOptions.map((opt) => (
              <div key={opt.title} className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6 flex flex-col justify-between h-full">
                <div className="flex items-center gap-3 mb-4">
                  {opt.icon}
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{opt.title}</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 flex-1">{opt.description}</p>
                <a href={opt.link} className="inline-block bg-primary text-white rounded-md px-4 py-2 font-medium hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary w-full text-center">{opt.button}</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

type StatVariant = 'slate' | 'amber' | 'sky' | 'emerald';
const variantClasses: Record<StatVariant, { bg: string; text: string; ring: string }> = {
  slate:   { bg: 'bg-slate-50 dark:bg-slate-800/60',   text: 'text-slate-800 dark:text-slate-100',   ring: 'ring-slate-200 dark:ring-slate-700' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-900 dark:text-amber-200',   ring: 'ring-amber-200/70 dark:ring-amber-800' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/20',       text: 'text-sky-900 dark:text-sky-200',       ring: 'ring-sky-200/70 dark:ring-sky-800' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-900 dark:text-emerald-200', ring: 'ring-emerald-200/70 dark:ring-emerald-800' },
};

const StatCard: React.FC<{ label: string; value: number; variant?: StatVariant }> = ({ label, value, variant = 'slate' }) => {
  const v = variantClasses[variant];
  return (
    <div className={`rounded-md shadow p-5 ring-1 ${v.bg} ${v.ring}`}>
      <p className={`text-sm ${variant === 'slate' ? 'text-slate-600 dark:text-slate-300' : v.text}`}>{label}</p>
      <p className={`text-2xl font-bold ${v.text}`}>{value}</p>
    </div>
  );
};

export default CitizenDashboard;