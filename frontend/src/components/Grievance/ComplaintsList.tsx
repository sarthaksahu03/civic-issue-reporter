import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
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

import { apiService } from '../../services/api';

const ComplaintsList: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await apiService.getGrievances({ userId: user?.id });
        if (!mounted) return;
        if (res.success && (res.data as any)?.grievances) {
          setItems((res.data as any).grievances);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (user?.id) load();
    return () => { mounted = false; };
  }, [user?.id]);

  // Map backend status to UI
  const mapStatus = (status: string) => {
    if (!status) return 'pending';
    return status.replace('_', '-');
  };

  const filteredGrievances = useMemo(() => {
    return items.filter(g => {
      const title = String(g.title || '').toLowerCase();
      const desc = String(g.description || '').toLowerCase();
      const matchesSearch = title.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase());
      const s = mapStatus(String(g.status || 'pending'));
      const matchesStatus = statusFilter === 'all' || s === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

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

  const selectedGrievance = useMemo(() => {
    return selectedComplaint ? items.find(g => g.id === selectedComplaint) : null;
  }, [items, selectedComplaint]);

  const canSubmitFeedback = useMemo(() => {
    if (!selectedGrievance) return false;
    const status = String(selectedGrievance.status || '').toLowerCase();
    return status === 'resolved';
  }, [selectedGrievance]);

  const submitFeedback = async () => {
    if (!selectedGrievance) return;
    try {
      setSubmittingFeedback(true);
      const res = await apiService.submitFeedback({
        grievanceId: selectedGrievance.id,
        userId: user?.id,
        rating,
        comments,
      });
      if (res.success) {
        alert('Thank you for your feedback!');
        setComments('');
        setRating(5);
      } else {
        alert('Failed to submit feedback: ' + (res as any).error);
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">My Complaints</h1>
        <p className="text-slate-600 dark:text-slate-300">Track the status of all your reported issues.</p>
      </section>

      {/* Filters */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search your complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2"
                aria-label="Search complaints"
              />
            </div>
            <label className="sr-only" htmlFor="status-filter">Status filter</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </section>

      {/* Complaints List */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-10">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredGrievances.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No complaints found' : 'No complaints yet'}
            </h3>
            <p className="text-slate-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by reporting your first issue to help improve your community.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredGrievances.map((grievance) => (
              <div key={grievance.id} className="py-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-2xl" aria-hidden="true">{getCategoryIcon(grievance.category)}</span>
                      <h3 className="text-lg font-semibold">{grievance.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(mapStatus(grievance.status))}`}>
                        {getStatusIcon(mapStatus(grievance.status))}
                        <span className="capitalize">{mapStatus(grievance.status).replace('-', ' ')}</span>
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
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{grievance.description}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{grievance.location?.address || grievance.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(grievance.created_at || grievance.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>

                    {grievance.adminResponse && (
                      <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-md mb-3">
                        <p className="text-sm font-medium text-sky-900 dark:text-sky-200 mb-1">Admin Response:</p>
                        <p className="text-sm text-sky-800 dark:text-sky-200/90">{grievance.adminResponse}</p>
                      </div>
                    )}
                    {grievance.rejection_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md mb-3">
                        <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800 dark:text-red-200/90">{grievance.rejection_reason}</p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedComplaint(grievance.id)}
                      className="inline-flex items-center gap-2 text-primary font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Timeline</span>
                    </button>
                  </div>

                  {(Array.isArray(grievance.image_urls) && grievance.image_urls.length > 0 || Array.isArray(grievance.images) && grievance.images.length > 0) && (
                    <div className="ml-2 sm:ml-6">
                      <img
                        src={(grievance.image_urls && grievance.image_urls[0]) || (grievance.images && grievance.images[0])}
                        alt="Issue"
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Timeline Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-md p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Complaint Timeline</h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
                aria-label="Close timeline"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl" aria-hidden="true">{getCategoryIcon(selectedGrievance.category)}</span>
                <h4 className="text-lg font-semibold">{selectedGrievance.title}</h4>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{selectedGrievance.description}</p>
              {(selectedGrievance.audio_url || selectedGrievance.audio) && (
                <div className="mt-4">
                  <audio controls src={selectedGrievance.audio_url || selectedGrievance.audio} className="w-full" />
                </div>
              )}
              {(Array.isArray(selectedGrievance.image_urls) && selectedGrievance.image_urls.length > 0) && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedGrievance.image_urls.map((url: string, idx: number) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer">
                      <img src={url} className="w-full h-28 object-cover rounded-md" />
                    </a>
                  ))}
                </div>
              )}
              {(Array.isArray(selectedGrievance.resolution_proof_urls) && selectedGrievance.resolution_proof_urls.length > 0) && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Resolution Proofs</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedGrievance.resolution_proof_urls.map((url: string, idx: number) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        <img src={url} className="w-full h-28 object-cover rounded-md" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {(selectedGrievance.timeline || []).map((entry: any) => (
                <div key={entry.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.status === 'resolved' ? 'bg-green-500' :
                      mapStatus(entry.status) === 'in-progress' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">
                        {mapStatus(entry.status).replace('-', ' ')}
                      </span>
                      <span className="text-sm text-slate-500">
                        {entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a') : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{entry.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback & Satisfaction (visible for resolved issues) */}
            {canSubmitFeedback && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-semibold mb-3">Rate the resolution</h4>
                <div className="flex items-center gap-3 mb-3">
                  <label htmlFor="rating" className="text-sm text-slate-600 dark:text-slate-300">Satisfaction:</label>
                  <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="px-3 py-2">
                    {[1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <span className="text-sm text-slate-500">1 = Poor, 5 = Excellent</span>
                </div>
                <textarea
                  placeholder="Optional feedback to help us improve..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full mb-3"
                  rows={3}
                />
                <button
                  onClick={submitFeedback}
                  disabled={submittingFeedback}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-full bg-slate-600 text-white py-2 rounded-md hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;