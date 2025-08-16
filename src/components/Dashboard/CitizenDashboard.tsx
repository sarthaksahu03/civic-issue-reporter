import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGrievance } from '../../contexts/GrievanceContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  FileText,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';

const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getUserGrievances } = useGrievance();
  const navigate = useNavigate();

  const userGrievances = getUserGrievances(user?.id || '');
  const pendingCount = userGrievances.filter(g => g.status === 'pending').length;
  const inProgressCount = userGrievances.filter(g => g.status === 'in-progress').length;
  const resolvedCount = userGrievances.filter(g => g.status === 'resolved').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'garbage': return '🗑️';
      case 'streetlight': return '💡';
      case 'water': return '💧';
      case 'road': return '🛣️';
      case 'noise': return '🔊';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Here's an overview of your reported issues and their current status.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/report')}
            className="bg-gradient-to-r from-sky-400 to-blue-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Report New Issue</h3>
                <p className="text-sky-100">
                  Found a problem? Let us know and we'll take care of it.
                </p>
              </div>
              <Plus className="h-8 w-8 text-sky-100" />
            </div>
          </button>

          <button
            onClick={() => navigate('/my-complaints')}
            className="bg-white/70 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">View My Complaints</h3>
                <p className="text-gray-600">
                  Track the status of all your reported issues.
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Complaints</h2>
          
          {userGrievances.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No complaints yet</h3>
              <p className="text-gray-500 mb-6">Start by reporting your first issue to help improve your community.</p>
              <button
                onClick={() => navigate('/report')}
                className="bg-gradient-to-r from-sky-400 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-sky-500 hover:to-blue-600 transition-all"
              >
                Report First Issue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userGrievances.slice(0, 5).map((grievance) => (
                <div key={grievance.id} className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getCategoryIcon(grievance.category)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{grievance.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                          {grievance.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{grievance.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{grievance.location.address}</span>
                        </div>
                        <span>{format(new Date(grievance.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    {grievance.images.length > 0 && (
                      <img
                        src={grievance.images[0]}
                        alt="Issue"
                        className="w-16 h-16 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>
                </div>
              ))}
              
              {userGrievances.length > 5 && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => navigate('/my-complaints')}
                    className="text-sky-600 hover:text-sky-700 font-medium"
                  >
                    View all {userGrievances.length} complaints →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;