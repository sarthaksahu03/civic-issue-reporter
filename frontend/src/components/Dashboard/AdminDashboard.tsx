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
    <div className="min-h-screen bg-background dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>

        {/* Overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && (
            <div className="col-span-4 flex items-center justify-center p-6 bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading admin stats...
            </div>
          )}
          {!loading && stats && (
            <>
              <Stat label="Total Users" value={stats.overview?.totalUsers || 0} />
              <Stat label="Total Grievances" value={stats.overview?.totalGrievances || 0} />
              <Stat label="Pending" value={stats.grievanceStats?.pending || 0} />
              <Stat label="Resolved" value={stats.grievanceStats?.resolved || 0} />
            </>
          )}
        </div>

        {/* Recent grievances */}
        <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Grievances</h2>
            <a href="/admin/grievances" className="text-primary">Manage</a>
          </div>
          <div className="space-y-3">
            {grievances.length === 0 && <p className="text-slate-500">No grievances found.</p>}
            {grievances.slice(0, 10).map(g => (
              <div key={g.id} className="flex items-center justify-between py-2 border-b last:border-b-0 border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{g.title}</p>
                  <p className="text-sm text-slate-500">{new Date(g.created_at).toLocaleString()} • {g.category}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 capitalize">{String(g.status).replace('_','-')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Grievances Map</h2>
          <div ref={mapRef} className="w-full h-80 rounded-md overflow-hidden" />
          <p className="text-xs text-slate-500 mt-2">Map pins are shown for grievances whose location contains coordinates like "12.9716, 77.5946".</p>
        </div>

        {/* Resolved History */}
        <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Resolved History</h2>
          <div className="space-y-3">
            {grievances.filter(g => String(g.status) === 'resolved').length === 0 && (
              <p className="text-slate-500">No resolved grievances yet.</p>
            )}
            {grievances.filter(g => String(g.status) === 'resolved').slice(0, 10).map(g => (
              <div key={g.id} className="flex items-center justify-between py-2 border-b last:border-b-0 border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{g.title}</p>
                  <p className="text-sm text-slate-500">Resolved on {new Date(g.updated_at || g.created_at).toLocaleString()}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">Resolved</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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