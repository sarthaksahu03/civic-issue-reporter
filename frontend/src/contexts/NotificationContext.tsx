import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification as NotificationType } from '../types'; // ✅ Renamed to avoid collision
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

interface NotificationContextType {
  notifications: NotificationType[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationType, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ✅ Custom hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Load from localStorage
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (isAuthenticated && user?.id) {
          const res = await apiService.getNotifications(user.id);
          if (!cancelled && res.success) {
            const apiNotifs = (res.data as any).notifications as any[];
            const mapped: NotificationType[] = apiNotifs.map((n) => ({
              id: n.id,
              userId: n.user_id,
              title: n.title,
              message: n.message,
              type: (n.type || 'info') as any,
              read: !!n.read,
              createdAt: n.created_at,
            }));
            setNotifications(mapped);
            try { localStorage.setItem('notifications', JSON.stringify(mapped)); } catch {}
            return;
          }
        }
      } catch {}
      // Fallback to local cache
      const stored = localStorage.getItem('notifications');
      if (!cancelled && stored) setNotifications(JSON.parse(stored));
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  // ✅ Add a new notification
  const addNotification = (notificationData: Omit<NotificationType, 'id' | 'createdAt'>) => {
    const newNotification: NotificationType = {
      ...notificationData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));

    // ✅ Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/vite.svg', // Change to your logo if needed
      });
    }
  };

  // ✅ Mark one as read
  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try { localStorage.setItem('notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
    // Best-effort backend update
    apiService.markNotificationRead(id).catch(() => {});
  };

  // ✅ Mark all as read
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    try { localStorage.setItem('notifications', JSON.stringify(updated)); } catch {}
    // Best-effort: mark each on backend
    Promise.all(updated.map(n => apiService.markNotificationRead(n.id))).catch(() => {});
  };

  // ✅ Clear all
  const clearNotifications = () => {
    setNotifications([]);
    try { localStorage.removeItem('notifications'); } catch {}
    if (isAuthenticated && user?.id) {
      apiService.clearNotifications(user.id).catch(() => {});
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
