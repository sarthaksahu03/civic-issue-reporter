import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const AdminFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'created_at' | 'rating' | 'category' | 'grievance'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const categories = useMemo(() => {
    const set = new Set<string>();
    feedbacks.forEach((f) => set.add(String(f.grievance?.category || 'others')));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [feedbacks]);

  const view = useMemo(() => {
    const filtered = feedbacks.filter((f) => selectedCategory === 'all' ? true : String(f.grievance?.category || 'others') === selectedCategory);
    const cmp = (a: any, b: any) => {
      let res = 0;
      switch (sortKey) {
        case 'rating':
          res = Number(a.rating) - Number(b.rating);
          break;
        case 'category':
          res = String(a.grievance?.category || '').localeCompare(String(b.grievance?.category || ''));
          break;
        case 'grievance':
          res = String(a.grievance?.title || '').localeCompare(String(b.grievance?.title || ''));
          break;
        case 'created_at':
        default:
          res = new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? res : -res;
    };
    return [...filtered].sort(cmp);
  }, [feedbacks, selectedCategory, sortKey, sortOrder]);

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
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-md p-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 mb-1">Category filter</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {categories.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-slate-500 mb-1">Sort by</label>
                  <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <option value="created_at">Date</option>
                    <option value="rating">Rating</option>
                    <option value="category">Category</option>
                    <option value="grievance">Grievance</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-500 mb-1">Order</label>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>

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
                  {view.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>No feedback yet.</td>
                    </tr>
                  ) : view.map(f => (
                    <tr key={f.id}>
                      <td className="px-4 py-2">
                        <div className="font-medium">{f.grievance?.title || f.grievance_id}</div>
                        <div className="text-xs text-slate-500">{f.grievance?.category} · {f.grievance?.status}</div>
                      </td>
                      <td className="px-4 py-2 text-sm">{f.user_id || '-'}</td>
                      <td className="px-4 py-2 text-sm">{f.rating} / 5</td>
                      <td className="px-4 py-2 text-sm max-w-[420px] truncate" title={f.comments || ''}>{f.comments || '-'}</td>
                      <td className="px-4 py-2 text-sm">{new Date(f.created_at || f.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminFeedbacks;
