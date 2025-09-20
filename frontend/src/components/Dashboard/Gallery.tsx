import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const Gallery: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.getPublicGallery();
        if (!mounted) return;
        if (res.success) {
          setItems(((res.data as any)?.items || []).filter((g: any) => Array.isArray(g.resolution_proof_urls) && g.resolution_proof_urls.length > 0));
          setError(null);
        } else {
          setError((res as any).error || 'Failed to load gallery');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen">
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Resolution Proof Gallery</h1>
        <p className="text-slate-600 dark:text-slate-300">Images uploaded by admins as proof of resolved grievances.</p>
      </section>

      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        {loading ? (
          <div className="py-10">Loading...</div>
        ) : error ? (
          <div className="py-10 text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-slate-600">No proofs uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((g) => (
              <div key={g.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
                <div className="mb-2">
                  <div className="text-sm text-slate-500">{new Date(g.created_at).toLocaleString()}</div>
                  <div className="font-semibold">{g.title}</div>
                  {g.category && <div className="text-xs text-slate-500 capitalize">Category: {g.category}</div>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {g.resolution_proof_urls.map((url: string, idx: number) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="block">
                      <img src={url} alt={`Proof ${idx+1}`} className="w-full h-28 object-cover rounded"/>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Gallery;
