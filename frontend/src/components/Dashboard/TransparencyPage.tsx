import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

// Simple Leaflet typings guard
declare const L: any;

const TransparencyPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [mapItems, setMapItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('open'); // open => pending|in_progress
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [statsRes, mapRes] = await Promise.all([
          api.getDashboardStats(),
          api.getPublicMapData(),
        ]);
        if (!mounted) return;
        if (statsRes.success) setStats((statsRes.data as any).stats);
        if (mapRes.success) setMapItems((mapRes.data as any).items || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    const container = document.getElementById('transparency-map');
    if (!container) return;
    // Avoid re-init
    if ((container as any)._leaflet_id) return;

    const map = L.map('transparency-map').setView([20.5937, 78.9629], 5); // Center on India by default
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    (container as any).__mapInstance = map;
  }, []);

  useEffect(() => {
    const container = document.getElementById('transparency-map') as any;
    const map = container && container.__mapInstance;
    if (!map) return;

    // Clear old markers layer
    if (container.__markers) {
      container.__markers.forEach((m: any) => map.removeLayer(m));
    }

    const filtered = mapItems.filter((it) => {
      if (statusFilter === 'open') return it.status === 'pending' || it.status === 'in_progress';
      if (statusFilter === 'resolved') return it.status === 'resolved';
      return true;
    });

    const markers = filtered.map((it) => {
      const color = it.status === 'resolved' ? 'green' : (it.status === 'in_progress' ? 'blue' : 'red');
      const marker = L.circleMarker([it.latitude, it.longitude], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.6,
      }).bindPopup(`<b>${it.title || 'Issue'}</b><br>Status: ${it.status}<br>Category: ${it.category || ''}`);
      marker.addTo(map);
      return marker;
    });

    container.__markers = markers;
  }, [mapItems, statusFilter]);

  const cards = useMemo(() => {
    if (!stats) return [] as any[];
    return [
      { label: 'Total Issues', value: stats.totalGrievances },
      { label: 'Pending', value: stats.pendingGrievances },
      { label: 'In Progress', value: stats.inProgressGrievances },
      { label: 'Resolved', value: stats.resolvedGrievances },
    ];
  }, [stats]);

  return (
    <div>
      <header className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Transparency & Live Data</h1>
        <p className="text-slate-600 dark:text-slate-300">Live statistics and a public map of issues to foster transparency and community engagement.</p>
      </header>

      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {loading ? (
          <div className="py-10">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
                <div className="text-slate-500 text-sm">{c.label}</div>
                <div className="text-2xl font-bold mt-1">{c.value ?? '-'}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Public Map</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2"
            aria-label="Filter map by status"
          >
            <option value="open">Open (Pending/In Progress)</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        </div>
        <div id="transparency-map" className="w-full h-[480px] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden" />
      </section>
    </div>
  );
};

export default TransparencyPage;
