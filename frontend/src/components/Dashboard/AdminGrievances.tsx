import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Loader2, CheckCircle2, XCircle, CircleDashed } from 'lucide-react';

const AdminGrievances: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAllGrievancesForAdmin();
      if (res.success && (res.data as any)?.grievances) setItems((res.data as any).grievances);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await apiService.updateGrievanceStatus(id, status);
      if (res.success && (res.data as any)?.grievance) {
        setItems(prev => prev.map(g => g.id === id ? (res.data as any).grievance : g));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Manage Grievances</h1>

        {loading ? (
          <div className="flex items-center justify-center p-10 bg-surface dark:bg-surface-dark rounded-md border border-slate-200 dark:border-slate-700">
            <Loader2 className="h-5 w-5 animate-spin mr-2"/> Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-surface dark:bg-surface-dark rounded-md border border-slate-200 dark:border-slate-700">No grievances found.</div>
        ) : (
          <div className="space-y-4">
            {items.map(g => (
              <div key={g.id} className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-semibold">{g.title}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{String(g.status).replace('_','-')}</span>
                      {g.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{g.category}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{g.description}</p>
                    <p className="text-xs text-slate-500">{new Date(g.created_at).toLocaleString()} • {g.location}</p>

                    {(Array.isArray(g.image_urls) && g.image_urls.length > 0) && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {g.image_urls.map((url: string, idx: number) => (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="block">
                            <img src={url} alt={`Image ${idx+1}`} className="w-full h-28 object-cover rounded-md"/>
                          </a>
                        ))}
                      </div>
                    )}

                    {g.audio_url && (
                      <div className="mt-3">
                        <audio controls src={g.audio_url} className="w-full">
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    {String(g.status) === 'resolved' ? (
                      <span className="px-3 py-2 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4"/> Completed
                      </span>
                    ) : (
                      <>
                        <button disabled={updatingId===g.id} onClick={() => setStatus(g.id, 'in_progress')} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"><CircleDashed className="h-4 w-4"/> In progress</button>
                        <button disabled={updatingId===g.id} onClick={() => setStatus(g.id, 'resolved')} className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/> Resolve</button>
                        <button disabled={updatingId===g.id} onClick={() => setStatus(g.id, 'rejected')} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 disabled:opacity-50"><XCircle className="h-4 w-4"/> Reject</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGrievances;
