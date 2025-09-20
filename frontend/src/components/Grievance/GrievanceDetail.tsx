import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Loader2, ArrowLeft, MapPin, Images, CheckCircle2, CircleDashed, XCircle } from 'lucide-react';

const GrievanceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grievance, setGrievance] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getGrievanceById(id);
        if (!cancelled) {
          if (res.success) {
            setGrievance((res.data as any)?.grievance || (res.data as any));
          } else {
            // Fallback: try list endpoint then find by ID
            const list = await apiService.getGrievances();
            if (list.success) {
              const arr = ((list.data as any)?.grievances || (list.data as any) || []) as any[];
              const found = arr.find(g => String(g.id) === String(id));
              if (found) {
                setGrievance(found);
              } else {
                setError((res as any).error || 'Failed to load grievance');
              }
            } else {
              setError((res as any).error || 'Failed to load grievance');
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load grievance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error || !grievance) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:underline"><ArrowLeft className="h-4 w-4"/> Back</button>
          <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">{error || 'Grievance not found'}</div>
        </div>
      </div>
    );
  }

  const statusChip = () => {
    const s = String(grievance.status);
    if (s === 'resolved') return (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs"><CheckCircle2 className="h-3 w-3"/> Resolved</span>);
    if (s === 'in_progress' || s === 'in-progress') return (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs"><CircleDashed className="h-3 w-3"/> In Progress</span>);
    if (s === 'rejected') return (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs"><XCircle className="h-3 w-3"/> Rejected</span>);
    return (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs">{s}</span>);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:underline"><ArrowLeft className="h-4 w-4"/> Back</button>
          {statusChip()}
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md p-5">
          <h1 className="text-2xl font-bold mb-2">{grievance.title}</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-3">{grievance.description}</p>
          <div className="text-sm text-slate-500 flex flex-wrap gap-4">
            <span>Category: <span className="capitalize">{String(grievance.category).replace('_',' ')}</span></span>
            <span>Priority: <span className="capitalize">{grievance.priority}</span></span>
            <span>Created: {new Date(grievance.created_at || grievance.createdAt).toLocaleString()}</span>
          </div>
          {grievance.location && (
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2"><MapPin className="h-4 w-4"/> {grievance.location}</div>
          )}

          {(Array.isArray(grievance.image_urls || grievance.images) && (grievance.image_urls || grievance.images).length > 0) && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2"><Images className="h-4 w-4"/> Images</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(grievance.image_urls || grievance.images).map((url: string, idx: number) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Image ${idx+1}`} className="w-full h-28 object-cover rounded-md"/>
                  </a>
                ))}
              </div>
            </div>
          )}

          {grievance.audio_url && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Audio</p>
              <audio controls src={grievance.audio_url} className="w-full" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>ID: {grievance.id}</span>
          <Link to="/my-complaints" className="text-primary hover:underline">Back to My Complaints</Link>
        </div>
      </div>
    </div>
  );
};

export default GrievanceDetail;
