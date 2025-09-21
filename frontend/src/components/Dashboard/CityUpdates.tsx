import React, { useEffect, useMemo, useState } from 'react';

interface UpdateItem {
  id: string;
  title: string;
  summary: string;
  link?: string;
  publishedAt?: string;
  category?: string;
  source?: string;
}

const DEFAULT_SAMPLE: UpdateItem[] = [
  {
    id: 'sample-1',
    title: 'Road Maintenance Scheduled in Ward 14',
    summary: 'The municipality will begin resurfacing and pothole repairs across Ward 14 from next Monday. Expect diversions between 10am-4pm.',
    link: '#',
    publishedAt: new Date().toISOString(),
    category: 'Infrastructure',
    source: 'CivicEyes',
  },
  {
    id: 'sample-2',
    title: 'Water Supply Interruption on Friday',
    summary: 'Due to pipeline upgrade work, water supply will be interrupted in zones A and B between 12pm-6pm. Tankers will be deployed on request.',
    link: '#',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    category: 'Water',
    source: 'CivicEyes',
  },
  {
    id: 'sample-3',
    title: 'E-waste Collection Drive This Weekend',
    summary: 'Dispose old electronics responsibly. Collection centers will be set up at community halls in sectors 2, 5, and 9 from 9am-5pm.',
    link: '#',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: 'Environment',
    source: 'CivicEyes',
  },
];

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const CityUpdates: React.FC = () => {
  const [items, setItems] = useState<UpdateItem[]>(DEFAULT_SAMPLE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');

  const FEEDS = (import.meta.env.VITE_CITY_UPDATES_FEEDS as string | undefined)?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const BACKEND_UPDATES_URL = import.meta.env.VITE_CITY_UPDATES_API as string | undefined; // optional JSON endpoint

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        // If a backend JSON endpoint is provided, prefer that
        if (BACKEND_UPDATES_URL) {
          const res = await fetch(BACKEND_UPDATES_URL);
          if (!res.ok) throw new Error('Failed to fetch updates');
          const data = await res.json();
          if (Array.isArray(data)) {
            // Expecting array of { id,title,summary,link,publishedAt,category,source }
            setItems(data);
            return;
          }
        }
        // Otherwise, try RSS feeds from env (may be blocked by CORS depending on source)
        if (FEEDS.length > 0) {
          const results: UpdateItem[] = [];
          for (const url of FEEDS) {
            try {
              const r = await fetch(url);
              const text = await r.text();
              const doc = new DOMParser().parseFromString(text, 'application/xml');
              const chanTitle = doc.querySelector('channel>title')?.textContent || new URL(url).hostname;
              doc.querySelectorAll('item').forEach((it, idx) => {
                const title = it.querySelector('title')?.textContent || 'Update';
                const link = it.querySelector('link')?.textContent || undefined;
                const pubDate = it.querySelector('pubDate')?.textContent || undefined;
                const category = it.querySelector('category')?.textContent || undefined;
                const desc = it.querySelector('description')?.textContent || '';
                results.push({
                  id: `${url}-${idx}-${title}`,
                  title,
                  summary: desc.replace(/<[^>]+>/g, '').trim().slice(0, 280),
                  link,
                  publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
                  category,
                  source: chanTitle,
                });
              });
            } catch (e) {
              // Ignore individual feed errors to allow partial success
              console.warn('Failed to read feed', url, e);
            }
          }
          if (results.length > 0) {
            // Sort latest first
            results.sort((a,b) => new Date(b.publishedAt||0).getTime() - new Date(a.publishedAt||0).getTime());
            setItems(results);
            return;
          }
        }
        // Fallback to sample
        setItems(DEFAULT_SAMPLE);
      } catch (e) {
        setError('Unable to load city updates. Showing recent samples.');
        setItems(DEFAULT_SAMPLE);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(i => i.category && cats.add(i.category));
    return ['all', ...Array.from(cats)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchesQ = q.trim().length === 0 || (i.title + ' ' + i.summary).toLowerCase().includes(q.toLowerCase());
      const matchesC = category === 'all' || (i.category || '').toLowerCase() === category.toLowerCase();
      return matchesQ && matchesC;
    });
  }, [items, q, category]);

  return (
    <div className="min-h-screen">
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">City Updates</h1>
        <p className="text-slate-600 dark:text-slate-300">See the latest news and updates from your municipality.</p>
      </section>

      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 md:py-6 flex flex-col md:flex-row gap-3 md:items-center">
          <input
            type="text"
            placeholder="Search updates..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 px-3 py-2"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 w-full md:w-auto">
            {categories.map(c => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">Refresh</button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-10">
        {loading && <div className="text-center text-slate-600 dark:text-slate-300 py-8">Loading updates...</div>}
        {error && <div className="text-center text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 mb-4">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map(u => (
            <article key={u.id} className="rounded-md bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 p-5 hover:shadow transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 pr-2">{u.title}</h3>
                {u.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{u.category}</span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4 mb-3">{u.summary}</p>
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>{u.source || 'Municipality'}{u.publishedAt ? ` • ${formatDate(u.publishedAt)}` : ''}</span>
                {u.link && <a className="text-primary underline-offset-2 hover:underline" href={u.link} target="_blank" rel="noreferrer">Open</a>}
              </div>
            </article>
          ))}
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center text-slate-500 py-10">No updates found.</div>
        )}
      </section>
    </div>
  );
};

export default CityUpdates;
