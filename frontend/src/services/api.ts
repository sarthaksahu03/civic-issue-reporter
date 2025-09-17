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

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
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

  async updateGrievanceStatus(grievanceId: string, status: string) {
    return this.request(`/grievances/${grievanceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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
}

export const apiService = new ApiService();
export default apiService;
