import React, { useState } from 'react';
import { useGrievance } from '../../contexts/GrievanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Filter,
  Search,
  MapPin,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const { grievances, updateGrievanceStatus } = useGrievance();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedGrievance, setSelectedGrievance] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const filteredGrievances = grievances.filter(grievance => {
    const matchesSearch = grievance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grievance.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || grievance.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || grievance.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pendingCount = grievances.filter(g => g.status === 'pending').length;
  const inProgressCount = grievances.filter(g => g.status === 'in-progress').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved').length;

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

  const handleStatusUpdate = (grievanceId: string, newStatus: string) => {
    updateGrievanceStatus(grievanceId, newStatus as any, responseText, user?.id);
    setSelectedGrievance(null);
    setResponseText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage and track all citizen grievances efficiently.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{grievances.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </div>
          </div>

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

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
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

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Streetlight</option>
              <option value="water">Water</option>
              <option value="road">Road</option>
              <option value="noise">Noise</option>
              <option value="others">Others</option>
            </select>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Grievances ({filteredGrievances.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredGrievances.map((grievance) => (
              <div key={grievance.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getCategoryIcon(grievance.category)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{grievance.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                        {grievance.status.replace('-', ' ')}
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
                      <span>By: {grievance.citizenName}</span>
                    </div>

                    {grievance.adminResponse && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Admin Response:</span>
                        </div>
                        <p className="text-sm text-blue-700">{grievance.adminResponse}</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {grievance.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(grievance.id, 'in-progress')}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          Start Progress
                        </button>
                      )}
                      {grievance.status === 'in-progress' && (
                        <button
                          onClick={() => handleStatusUpdate(grievance.id, 'resolved')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedGrievance(grievance.id)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        Add Response
                      </button>
                    </div>
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
        </div>

        {/* Response Modal */}
        {selectedGrievance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Response</h3>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter your response..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-4"
                rows={4}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedGrievance(null);
                    setResponseText('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const grievance = grievances.find(g => g.id === selectedGrievance);
                    if (grievance) {
                      handleStatusUpdate(selectedGrievance, grievance.status);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  Send Response
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;