import React, { useState } from 'react';
import { useGrievance } from '../../contexts/GrievanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Filter, 
  Search, 
  MapPin, 
  Calendar, 
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

const ComplaintsList: React.FC = () => {
  const { getUserGrievances } = useGrievance();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);

  const userGrievances = getUserGrievances(user?.id || '');
  
  const filteredGrievances = userGrievances.filter(grievance => {
    const matchesSearch = grievance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grievance.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || grievance.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <TrendingUp className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
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

  const selectedGrievance = selectedComplaint ? 
    userGrievances.find(g => g.id === selectedComplaint) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Complaints
          </h1>
          <p className="text-gray-600">
            Track the status of all your reported issues.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {filteredGrievances.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No complaints found' : 'No complaints yet'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by reporting your first issue to help improve your community.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredGrievances.map((grievance) => (
                <div key={grievance.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getCategoryIcon(grievance.category)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{grievance.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(grievance.status)}`}>
                          {getStatusIcon(grievance.status)}
                          <span>{grievance.status.replace('-', ' ')}</span>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          grievance.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                          grievance.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          grievance.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {grievance.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{grievance.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{grievance.location.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(grievance.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      {grievance.adminResponse && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <p className="text-sm font-medium text-blue-800 mb-1">Admin Response:</p>
                          <p className="text-sm text-blue-700">{grievance.adminResponse}</p>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedComplaint(grievance.id)}
                        className="flex items-center space-x-2 text-sky-600 hover:text-sky-700 font-medium text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Timeline</span>
                      </button>
                    </div>

                    {grievance.images.length > 0 && (
                      <div className="ml-6">
                        <img
                          src={grievance.images[0]}
                          alt="Issue"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline Modal */}
        {selectedGrievance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Complaint Timeline</h3>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getCategoryIcon(selectedGrievance.category)}</span>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedGrievance.title}</h4>
                </div>
                <p className="text-gray-600">{selectedGrievance.description}</p>
              </div>

              <div className="space-y-4">
                {selectedGrievance.timeline.map((entry, index) => (
                  <div key={entry.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-3 h-3 rounded-full ${
                        entry.status === 'resolved' ? 'bg-green-500' :
                        entry.status === 'in-progress' ? 'bg-blue-500' :
                        'bg-orange-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 capitalize">
                          {entry.status.replace('-', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{entry.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsList;