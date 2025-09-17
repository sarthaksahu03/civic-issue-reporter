import React, { createContext, useContext, useState, useEffect } from 'react';
import { Grievance, TimelineEntry } from '../types';
import { useNotifications } from './NotificationContext';

interface GrievanceContextType {
  grievances: Grievance[];
  addGrievance: (grievance: Omit<Grievance, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) => void;
  updateGrievanceStatus: (id: string, status: Grievance['status'], adminResponse?: string, adminId?: string) => void;
  getUserGrievances: (userId: string) => Grievance[];
  getGrievancesByCategory: () => Record<string, number>;
  getGrievancesByStatus: () => Record<string, number>;
}

const GrievanceContext = createContext<GrievanceContextType | undefined>(undefined);

export const useGrievance = () => {
  const context = useContext(GrievanceContext);
  if (!context) {
    throw new Error('useGrievance must be used within a GrievanceProvider');
  }
  return context;
};

export const GrievanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const notificationContext = useNotifications();

  useEffect(() => {
    const storedGrievances = localStorage.getItem('grievances');
    if (storedGrievances) {
      setGrievances(JSON.parse(storedGrievances));
    } else {
      // Initialize with some mock data
      const mockGrievances: Grievance[] = [
        {
          id: '1',
          title: 'Broken Streetlight',
          description: 'Street light has been broken for 2 weeks on Main Street',
          category: 'streetlight',
          status: 'in-progress',
          priority: 'medium',
          citizenId: '2',
          citizenName: 'John Doe',
          citizenEmail: 'citizen@example.com',
          location: {
            address: '123 Main Street, Downtown',
            latitude: 40.7128,
            longitude: -74.0060,
          },
          images: ['https://images.pexels.com/photos/220429/pexels-photo-220429.jpeg?auto=compress&cs=tinysrgb&w=400'],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          adminResponse: 'Work order has been assigned to maintenance team.',
          adminId: '1',
          timeline: [
            {
              id: '1',
              status: 'pending',
              message: 'Complaint submitted',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: '2',
              status: 'in-progress',
              message: 'Assigned to maintenance team',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              adminId: '1',
            },
          ],
        },
        {
          id: '2',
          title: 'Garbage Overflow',
          description: 'Garbage bins are overflowing in the park area',
          category: 'garbage',
          status: 'resolved',
          priority: 'high',
          citizenId: '2',
          citizenName: 'John Doe',
          citizenEmail: 'citizen@example.com',
          location: {
            address: 'Central Park, North Avenue',
            latitude: 40.7829,
            longitude: -73.9654,
          },
          images: ['https://images.pexels.com/photos/802221/pexels-photo-802221.jpeg?auto=compress&cs=tinysrgb&w=400'],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          adminResponse: 'Additional bins have been installed and waste cleared.',
          adminId: '1',
          timeline: [
            {
              id: '1',
              status: 'pending',
              message: 'Complaint submitted',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: '2',
              status: 'in-progress',
              message: 'Cleaning team dispatched',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              adminId: '1',
            },
            {
              id: '3',
              status: 'resolved',
              message: 'Issue resolved, additional bins installed',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              adminId: '1',
            },
          ],
        },
      ];
      setGrievances(mockGrievances);
      localStorage.setItem('grievances', JSON.stringify(mockGrievances));
    }
  }, []);

  const addGrievance = (grievanceData: Omit<Grievance, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) => {
    const newGrievance: Grievance = {
      ...grievanceData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: Date.now().toString(),
          status: 'pending',
          message: 'Complaint submitted',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const updatedGrievances = [...grievances, newGrievance];
    setGrievances(updatedGrievances);
    localStorage.setItem('grievances', JSON.stringify(updatedGrievances));
  };

  const updateGrievanceStatus = (id: string, status: Grievance['status'], adminResponse?: string, adminId?: string) => {
    const updatedGrievances = grievances.map(grievance => {
      if (grievance.id === id) {
        const oldStatus = grievance.status;
        const newTimelineEntry: TimelineEntry = {
          id: Date.now().toString(),
          status,
          message: adminResponse || `Status updated to ${status}`,
          timestamp: new Date().toISOString(),
          adminId,
        };

        const updatedGrievance = {
          ...grievance,
          status,
          adminResponse,
          adminId,
          updatedAt: new Date().toISOString(),
          timeline: [...grievance.timeline, newTimelineEntry],
        };

        // Send notification to citizen when status changes to resolved
        if (status === 'resolved' && oldStatus !== 'resolved' && notificationContext) {
          notificationContext.addNotification({
            userId: grievance.citizenId,
            title: 'Complaint Resolved! 🎉',
            message: `Your complaint "${grievance.title}" has been resolved. ${adminResponse || 'Thank you for reporting this issue.'}`,
            type: 'success',
            read: false,
            grievanceId: id,
          });
        }

        return updatedGrievance;
      }
      return grievance;
    });

    setGrievances(updatedGrievances);
    localStorage.setItem('grievances', JSON.stringify(updatedGrievances));
  };

  const getUserGrievances = (userId: string) => {
    return grievances.filter(grievance => grievance.citizenId === userId);
  };

  const getGrievancesByCategory = () => {
    return grievances.reduce((acc, grievance) => {
      acc[grievance.category] = (acc[grievance.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getGrievancesByStatus = () => {
    return grievances.reduce((acc, grievance) => {
      acc[grievance.status] = (acc[grievance.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  return (
    <GrievanceContext.Provider value={{
      grievances,
      addGrievance,
      updateGrievanceStatus,
      getUserGrievances,
      getGrievancesByCategory,
      getGrievancesByStatus,
    }}>
      {children}
    </GrievanceContext.Provider>
  );
};