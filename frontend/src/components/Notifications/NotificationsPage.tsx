import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notifications
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={markAllAsRead} className="px-3 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:opacity-90">Mark all as read</button>
            <button onClick={clearNotifications} className="px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600">Clear all</button>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow divide-y divide-slate-200 dark:divide-slate-700">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">You're all caught up!</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-5 ${!n.read ? 'bg-slate-50 dark:bg-slate-800' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{format(new Date(n.createdAt), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  {!n.read ? (
                    <button onClick={() => markAsRead(n.id)} className="px-2 py-1 text-xs rounded-md bg-primary text-white hover:bg-primary/90 flex items-center gap-1">
                      <CheckCheck className="h-3 w-3" /> Mark read
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Read</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Total: {notifications.length}</span>
          <span>Unread: {unreadCount}</span>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
