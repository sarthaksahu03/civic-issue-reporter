import React, { useEffect, useRef, useState } from 'react';
import { apiService } from '../../services/api';
import { Loader2 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const geocodeCacheRef = useRef<Record<string, [number, number]>>({});

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [statsRes, grievancesRes] = await Promise.all([
          apiService.getAdminStats(),
          apiService.getAllGrievancesForAdmin(),
        ]);
        if (!isMounted) return;
        if (statsRes.success && (statsRes.data as any)?.stats) setStats((statsRes.data as any).stats);
        if (grievancesRes.success && (grievancesRes.data as any)?.grievances) setGrievances((grievancesRes.data as any).grievances);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Load geocode cache once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('geocodeCache');
      if (raw) geocodeCacheRef.current = JSON.parse(raw);
    } catch {}
  }, []);

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;
    // @ts-ignore - leaflet is loaded globally from CDN
    const L = (window as any).L;
    if (!L) return; // Leaflet not loaded yet

    // Initialize map once
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([20.5937, 78.9629], 4); // Center on India by default
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance.current);
    }

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers for grievances with coordinates
    (async () => {
      const coords: [number, number][] = [];
      const cache: Record<string, [number, number]> = geocodeCacheRef.current as any;

      // Helper to add a marker
      const addMarker = (latLng: [number, number], g: any) => {
        // @ts-ignore
        const marker = L.marker(latLng).addTo(mapInstance.current).bindPopup(
          `<strong>${escapeHtml(g.title)}</strong><br/>${escapeHtml(g.category || '')}<br/>${escapeHtml(g.location || '')}`
        );
        markersRef.current.push(marker);
        coords.push(latLng);
      };

      // Geocode sequentially to respect Nominatim rate limits
      for (const g of grievances) {
        let latLng: [number, number] | null = null;
        if (typeof g.latitude === 'number' && typeof g.longitude === 'number') {
          latLng = [g.latitude, g.longitude];
        }
        if (!latLng) latLng = parseLocation(g.location);
        if (!latLng && g.location) {
          const key = String(g.location);
          if (cache[key]) {
            latLng = cache[key];
          } else {
            const geo = await geocode(String(g.location));
            if (geo) {
              cache[key] = geo;
              try { localStorage.setItem('geocodeCache', JSON.stringify(cache)); } catch {}
              latLng = geo;
              // small delay to be nice to the service
              await sleep(500);
            }
          }
        }
        if (latLng) addMarker(latLng, g);
      }

      if (coords.length > 0) {
        // @ts-ignore
        const group = L.featureGroup(markersRef.current);
        mapInstance.current.fitBounds(group.getBounds().pad(0.2));
      }
    })();
  }, [grievances]);

  const parseLocation = (loc?: any): [number, number] | null => {
    if (!loc || typeof loc !== 'string') return null;
    const parts = loc.split(',').map((s: string) => s.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return [lat, lng];
  };

  const geocode = async (query: string): Promise<[number, number] | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch {
      return null;
    }
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const escapeHtml = (s: string) => String(s).replace(/[&<>"]+/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[c] as string));

  return (
    <div className="min-h-screen">
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
      </section>

      {/* Overview stats - full width strip */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-8">
          {loading && (
            <div className="flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading admin stats...
            </div>
          )}
          {!loading && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Stat label="Total Users" value={stats.overview?.totalUsers || 0} />
              <Stat label="Total Grievances" value={stats.overview?.totalGrievances || 0} />
              <Stat label="Pending" value={stats.grievanceStats?.pending || 0} />
              <Stat label="Resolved" value={stats.grievanceStats?.resolved || 0} />
            </div>
          )}
        </div>
      </section>

      {/* Recent grievances */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Recent Grievances</h2>
          <a href="/admin/grievances" className="text-primary underline-offset-2 hover:underline">Manage</a>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {grievances.length === 0 && <p className="text-slate-500 py-6">No grievances found.</p>}
          {grievances.slice(0, 10).map(g => (
            <div key={g.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{g.title}</p>
                <p className="text-sm text-slate-500">{new Date(g.created_at).toLocaleString()} • {g.category}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 capitalize">{String(g.status).replace('_','-')}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Map */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-10">
          <h2 className="text-xl font-semibold mb-4">Grievances Map</h2>
          <div ref={mapRef} className="w-full h-80 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800" />
          <p className="text-xs text-slate-500 mt-2">Map pins are shown for grievances whose location contains coordinates like "12.9716, 77.5946".</p>
        </div>
      </section>

      {/* Resolved History */}
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-10">
        <h2 className="text-xl font-semibold mb-3">Resolved History</h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {grievances.filter(g => String(g.status) === 'resolved').length === 0 && (
            <p className="text-slate-500 py-6">No resolved grievances yet.</p>
          )}
          {grievances.filter(g => String(g.status) === 'resolved').slice(0, 10).map(g => (
            <div key={g.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{g.title}</p>
                <p className="text-sm text-slate-500">Resolved on {new Date(g.updated_at || g.created_at).toLocaleString()}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">Resolved</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
  </div>
);

export default AdminDashboard;