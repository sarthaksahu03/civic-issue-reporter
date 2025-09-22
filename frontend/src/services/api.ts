const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async adminLogin(email: string, password: string) {
    return this.request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async syncProfile(payload: { id: string; email: string; name?: string; role?: 'admin' | 'citizen' }) {
    return this.request('/auth/sync-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // User endpoints
  async getUserProfile(userId: string) {
    return this.request(`/user/${userId}`);
  }

  async updateUserProfile(userId: string, updates: any) {
    return this.request(`/user/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Grievance endpoints
  async getGrievances(filters?: { userId?: string; status?: string; category?: string }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    
    const queryString = params.toString();
    return this.request(`/grievances${queryString ? `?${queryString}` : ''}`);
  }

  async getGrievanceById(grievanceId: string) {
    return this.request(`/grievances/${grievanceId}`);
  }

  async createGrievance(grievance: {
    title: string;
    description: string;
    category: string;
    location: string;
    userId: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.request('/grievances', {
      method: 'POST',
      body: JSON.stringify({ ...grievance, status: 'pending' }),
    });
  }

  async createGrievanceWithMedia(grievance: {
    title: string;
    description: string;
    category: string;
    location: string;
    userId: string;
    images?: string[]; // base64 data URLs
    audio?: string;    // base64 data URL
    latitude?: number;
    longitude?: number;
  }) {
    return this.request('/grievances/with-media', {
      method: 'POST',
      body: JSON.stringify({ ...grievance, status: 'pending' }),
    });
  }

  async updateGrievanceStatus(grievanceId: string, status: string, estimatedDays?: number) {
    const payload: any = { status };
    if (typeof estimatedDays === 'number' && isFinite(estimatedDays)) {
      payload.estimatedDays = estimatedDays;
    }
    return this.request(`/grievances/${grievanceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Admin actions with required inputs
  async resolveWithProof(grievanceId: string, images: string[]) {
    return this.request(`/grievances/${grievanceId}/resolve-with-proof`, {
      method: 'POST',
      body: JSON.stringify({ images }),
    });
  }

  async rejectGrievanceWithReason(grievanceId: string, reason: string) {
    return this.request(`/grievances/${grievanceId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Dashboard statistics
  async getDashboardStats(userId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    
    const queryString = params.toString();
    return this.request(`/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  }

  async getRecentGrievances(userId?: string, limit: number = 5) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    params.append('limit', limit.toString());
    
    const queryString = params.toString();
    return this.request(`/dashboard/recent${queryString ? `?${queryString}` : ''}`);
  }

  // Admin endpoints
  async getAllUsers() {
    return this.request('/admin/users');
  }

  async getAllGrievancesForAdmin() {
    return this.request('/admin/grievances');
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }

  // Feedback & Satisfaction
  async submitFeedback(payload: { grievanceId: string; userId?: string; rating: number; comments?: string }) {
    return this.request('/feedbacks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminFeedbacks() {
    return this.request('/feedbacks/admin');
  }

  // Public feedbacks endpoint (currently proxies to admin endpoint until backend provides a public route)
  // Returns feedbacks without requiring admin context. Frontend must ensure no user-identifying info is displayed.
  async getPublicFeedbacks() {
    return this.request('/feedbacks/admin');
  }

  // Emergency Report
  async reportEmergency(payload: {
    title?: string;
    description?: string;
    category?: string;
    location?: string;
    userId?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.request('/grievances/emergency', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Public Transparency endpoints
  async getPublicMapData(status?: 'pending' | 'in_progress' | 'resolved' | 'rejected') {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const qs = params.toString();
    return this.request(`/grievances/public-map${qs ? `?${qs}` : ''}`);
  }

  async getPublicGallery() {
    return this.request(`/grievances/public-gallery`);
  }

  // Notifications
  async getNotifications(userId: string) {
    const params = new URLSearchParams();
    params.append('userId', userId);
    return this.request(`/notifications?${params.toString()}`);
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async clearNotifications(userId: string) {
    const params = new URLSearchParams();
    params.append('userId', userId);
    return this.request(`/notifications?${params.toString()}`, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
export default apiService;

