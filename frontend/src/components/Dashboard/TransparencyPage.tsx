import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

// Simple Leaflet typings guard
declare const L: any;

const TransparencyPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [mapItems, setMapItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('open'); // open => pending|in_progress
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [statsRes, mapRes, feedbackRes] = await Promise.all([
          api.getDashboardStats(),
          api.getPublicMapData(),
          api.getPublicFeedbacks(),
        ]);
        if (!mounted) return;
        if (statsRes.success) setStats((statsRes.data as any).stats);
        if (mapRes.success) setMapItems((mapRes.data as any).items || []);
        if (feedbackRes.success) {
          setFeedbacks(((feedbackRes.data as any).feedbacks || []).filter((f: any) => f && (f.comments || f.rating)));
          setFeedbackError(null);
        } else {
          setFeedbackError((feedbackRes as any).error || 'Failed to load feedback');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    // initial load
    load();

    // lightweight polling for map items to keep dots fresh
    const pollIntervalMs = 15000; // 15s polling
    let intervalId: number | null = null;
    const tick = async () => {
      try {
        if (document.hidden) return; // skip work when tab is hidden
        const res = await api.getPublicMapData();
        if (!mounted) return;
        if (res.success) {
          setMapItems((res.data as any).items || []);
        }
      } catch (_) {
        // ignore transient errors during polling
      }
    };
    const startPolling = () => {
      if (intervalId !== null) return; // already polling
      intervalId = window.setInterval(tick, pollIntervalMs);
    };
    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };
    startPolling();

    // pause polling when tab is hidden to save resources, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // trigger an immediate refresh and resume polling when user comes back
        load();
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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

    // Group by approximate coordinates to detect overlaps
    const groups = new Map<string, any[]>();
    const keyFor = (lat: number, lon: number) => `${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}`;
    for (const it of filtered) {
      if (typeof it.latitude !== 'number' || typeof it.longitude !== 'number') continue;
      const k = keyFor(it.latitude, it.longitude);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(it);
    }

    // Convert meters to degrees helper
    const metersToDegrees = (meters: number, lat: number) => {
      const dLat = meters / 111320; // ~ meters per degree latitude
      const dLon = meters / (111320 * Math.cos((lat * Math.PI) / 180));
      return { dLat, dLon };
    };

    // Build a map of ID -> offset index for overlapping points
    const overlapIndex = new Map<string, number>();
    for (const [_, items] of groups) {
      if (items.length > 1) {
        items.forEach((it, idx) => {
          if (it.id) overlapIndex.set(it.id, idx);
        });
      }
    }

    const markers = filtered.map((it) => {
      const color = it.status === 'resolved' ? 'green' : (it.status === 'in_progress' ? 'blue' : 'red');
      // Apply a small offset if this point overlaps with others
      let lat = Number(it.latitude);
      let lon = Number(it.longitude);
      const idx = it.id ? overlapIndex.get(it.id) : undefined;
      const groupKey = keyFor(lat, lon);
      const groupSize = groups.get(groupKey)?.length || 1;
      if (typeof idx === 'number' && groupSize > 1) {
        // distribute markers around a small circle (~12 meters radius)
        const radiusMeters = 12;
        const angle = (2 * Math.PI * idx) / groupSize;
        const { dLat, dLon } = metersToDegrees(radiusMeters, lat);
        lat = lat + dLat * Math.sin(angle);
        lon = lon + dLon * Math.cos(angle);
      }

      const marker = L.circleMarker([lat, lon], {
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
      { label: 'Rejected', value: stats.rejectedGrievances },
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

      {/* Public Feedback Section */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 mt-8 mb-10">
        <h2 className="text-xl font-semibold mb-3">Citizen Feedback</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">We display feedback text and star rating for grievances to promote transparency while protecting user privacy.</p>

        {feedbackError ? (
          <div className="py-6 text-red-600">{feedbackError}</div>
        ) : loading ? (
          <div className="py-6">Loading feedback...</div>
        ) : feedbacks.length === 0 ? (
          <div className="py-6 text-slate-600">No feedback yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbacks.map((f, idx) => (
              <div key={f.id || idx} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
                {/* Star rating */}
                <div className="mb-2" aria-label={`Rating: ${f.rating || 0} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < (f.rating || 0) ? 'text-yellow-500' : 'text-slate-300'}>★</span>
                  ))}
                  <span className="ml-2 text-sm text-slate-600">{f.rating ? `${f.rating}/5` : 'No rating'}</span>
                </div>
                {/* Feedback text */}
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{f.comments || 'No comments provided.'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TransparencyPage;
