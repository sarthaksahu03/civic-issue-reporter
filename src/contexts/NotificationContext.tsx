import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification as NotificationType } from '../types'; // ✅ Renamed to avoid collision

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

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }
  }, []);

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
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  // ✅ Mark all as read
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  // ✅ Clear all
  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
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
