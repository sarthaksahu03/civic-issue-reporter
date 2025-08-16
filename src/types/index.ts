// src/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'admin';
  createdAt: string;
  phone?: string;
  address?: string;
  avatar?: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  grievanceId?: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface Grievance {
  id: string;
  title: string;
  description: string;
  category: 'garbage' | 'streetlight' | 'water' | 'road' | 'noise' | 'others';
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
  adminResponse?: string;
  adminId?: string;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  id: string;
  status: string;
  message: string;
  timestamp: string;
  adminId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
