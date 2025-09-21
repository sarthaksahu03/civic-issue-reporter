import React, { useMemo, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'createdAt' | 'title' | 'read'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const types = useMemo(() => {
    const set = new Set<string>();
    notifications.forEach(n => set.add(String(n.type || 'info')));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [notifications]);

  const view = useMemo(() => {
    const filtered = notifications.filter(n => selectedType === 'all' ? true : String(n.type || 'info') === selectedType);
    const cmp = (a: any, b: any) => {
      let res = 0;
      switch (sortKey) {
        case 'title':
          res = String(a.title || '').localeCompare(String(b.title || ''));
          break;
        case 'read':
          res = Number(a.read) - Number(b.read);
          break;
        case 'createdAt':
        default:
          res = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? res : -res;
    };
    return [...filtered].sort(cmp);
  }, [notifications, selectedType, sortKey, sortOrder]);

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

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md p-4">
          <div className="flex gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Type filter</label>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                {types.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Sort by</label>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option value="createdAt">Date</option>
                <option value="title">Title</option>
                <option value="read">Unread/Read</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Order</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow divide-y divide-slate-200 dark:divide-slate-700">
          {view.length === 0 ? (
            <div className="p-8 text-center text-slate-500">You're all caught up!</div>
          ) : (
            view.map(n => (
              <div
                key={n.id}
                className={`${!n.read ? 'bg-slate-50 dark:bg-slate-800' : ''} ${n.grievanceId ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''} p-5`}
                onClick={() => {
                  if (n.grievanceId) {
                    markAsRead(n.id);
                    navigate(`/grievances/${n.grievanceId}`);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{format(new Date(n.createdAt), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {n.grievanceId ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/grievances/${n.grievanceId}`); }}
                        className="px-2 py-1 text-xs rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:opacity-90"
                      >Open</button>
                    ) : n.link ? (
                      <a
                        href={n.link}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 text-xs rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:opacity-90"
                      >Open</a>
                    ) : null}
                    {!n.read ? (
                    <button onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} className="px-2 py-1 text-xs rounded-md bg-primary text-white hover:bg-primary/90 flex items-center gap-1">
                      <CheckCheck className="h-3 w-3" /> Mark read
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Read</span>
                  )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Total: {view.length}</span>
          <span>Unread: {unreadCount}</span>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
