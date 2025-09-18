import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.getAdminFeedbacks();
        if (!mounted) return;
        if (res.success) setFeedbacks((res.data as any).feedbacks || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <header className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">User Feedback</h1>
        <p className="text-slate-600 dark:text-slate-300">All feedback and satisfaction survey results from users after resolutions.</p>
      </header>

      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {loading ? (
          <div className="py-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/20">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Grievance</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Rating</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Comments</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {feedbacks.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>No feedback yet.</td>
                  </tr>
                ) : feedbacks.map(f => (
                  <tr key={f.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{f.grievance?.title || f.grievance_id}</div>
                      <div className="text-xs text-slate-500">{f.grievance?.category} · {f.grievance?.status}</div>
                    </td>
                    <td className="px-4 py-2 text-sm">{f.user_id || '-'}</td>
                    <td className="px-4 py-2 text-sm">{f.rating} / 5</td>
                    <td className="px-4 py-2 text-sm max-w-[420px] truncate" title={f.comments || ''}>{f.comments || '-'}</td>
                    <td className="px-4 py-2 text-sm">{new Date(f.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminFeedbacks;
