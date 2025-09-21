import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiService } from '../../services/api';
import { Loader2 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
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

  // Derived analytics from grievances for charts
  const { activityByDay, categoryCounts, resolution } = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (13 - i));
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    const byDay = days.map(ts => ({
      ts,
      count: grievances.filter(g => {
        const t = new Date(g.created_at || g.createdAt || Date.now());
        t.setHours(0,0,0,0);
        return t.getTime() === ts;
      }).length,
    }));

    const catCounts: Record<string, number> = {};
    grievances.forEach(g => {
      const c = String(g.category || 'others');
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    const resolved = grievances.filter(g => String(g.status).includes('resolved')).length;
    const pending = grievances.filter(g => String(g.status).includes('pending')).length;
    const inProgress = grievances.filter(g => String(g.status).includes('in-progress')).length;
    const total = Math.max(grievances.length, 1);
    return { activityByDay: byDay, categoryCounts: catCounts, resolution: { resolved, pending, inProgress, total } };
  }, [grievances]);

  // Load geocode cache once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('geocodeCache');
      if (raw) geocodeCacheRef.current = JSON.parse(raw);
    } catch {}
  }, []);

  // Initialize and update Leaflet map with markers and heat-like circles
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

    // Clear old markers and circles
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

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
      const points: Array<{ lat: number; lng: number; g: any }> = [];
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
        if (latLng) {
          addMarker(latLng, g);
          points.push({ lat: latLng[0], lng: latLng[1], g });
        }
      }

      // Build clusters within 2km by category
      type Cluster = { lat: number; lng: number; count: number; anyHigh: boolean; category: string };
      const clusters: Cluster[] = [];
      const RADIUS_KM = 2;
      const distKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
        const toRad = (v: number) => (v * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(b.lat - a.lat);
        const dLon = toRad(b.lng - a.lng);
        const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
      };
      for (const p of points) {
        let found = false;
        for (const c of clusters) {
          if (c.category === String(p.g.category || '')) {
            if (distKm({ lat: c.lat, lng: c.lng }, { lat: p.lat, lng: p.lng }) <= RADIUS_KM) {
              // merge into cluster (simple averaging for centroid)
              c.lat = (c.lat * c.count + p.lat) / (c.count + 1);
              c.lng = (c.lng * c.count + p.lng) / (c.count + 1);
              c.count += 1;
              c.anyHigh = c.anyHigh || String(p.g.priority) === 'high';
              found = true;
              break;
            }
          }
        }
        if (!found) {
          clusters.push({ lat: p.lat, lng: p.lng, count: 1, anyHigh: String(p.g.priority) === 'high', category: String(p.g.category || '') });
        }
      }

      // Draw circle overlays as a heat-like visualization
      const colorFor = (c: Cluster) => {
        if (c.anyHigh || c.count >= 6) return '#dc2626'; // red
        if (c.count >= 3) return '#f97316'; // orange
        return '#c4f50a'; // amber
      };
      const radiusFor = (c: Cluster) => {
        if (c.count >= 6) return 1500;
        if (c.count >= 3) return 1000;
        return 600;
      };
      clusters.forEach((c) => {
        const circle = L.circle([c.lat, c.lng], {
          radius: radiusFor(c),
          color: colorFor(c),
          fillColor: colorFor(c),
          fillOpacity: 0.25,
          weight: 1,
        })
          .addTo(mapInstance.current)
          .bindPopup(`<strong>${escapeHtml(c.category || 'issue')}</strong><br/>${c.count} reports${c.anyHigh ? ' • priority' : ''}`);
        circlesRef.current.push(circle);
      });

      if (coords.length > 0 || circlesRef.current.length > 0) {
        // @ts-ignore
        const group = L.featureGroup([...markersRef.current, ...circlesRef.current]);
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
        {/* Analytics grid */}
        <h2 className="text-xl font-semibold mb-4">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Activity line chart */}
          <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-4 relative">
            <h3 className="font-medium mb-3">User Activity (14 days)</h3>
            <ChartLine data={activityByDay.map(d => d.count)} labels={activityByDay.map(d => new Date(d.ts).toLocaleDateString())} />
          </div>
          {/* Categories bar chart */}
          <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-4 relative">
            <h3 className="font-medium mb-3">Issue Categories</h3>
            <ChartBars data={Object.values(categoryCounts)} labels={Object.keys(categoryCounts)} />
          </div>
          {/* Resolution donut */}
          <div className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md shadow p-4 relative">
            <h3 className="font-medium mb-3">Resolution Rates</h3>
            <ChartDonut
              values={[resolution.resolved, resolution.inProgress, resolution.pending]}
              colors={["#10b981", "#0ea5e9", "#f59e0b"]}
              labels={["Resolved", "In Progress", "Pending"]}
            />
          </div>
        </div>
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
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
            <span>Markers show individual grievances. Colored circles visualize density within ~2km:</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{background:'#c4f50a'}}></span> low</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{background:'#f97316'}}></span> medium (≥3)</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{background:'#dc2626'}}></span> high / priority</span>
          </div>
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

// Simple SVG charts (no external deps)
const ChartLine: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
  const width = 320;
  const height = 120;
  const padding = 24;
  const max = Math.max(...data, 1);
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (v / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  const [hover, setHover] = React.useState<{ x: number; y: number; i: number } | null>(null);
  return (
    <>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40"
        onMouseLeave={() => setHover(null)}>
        <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points} />
        {data.map((v, i) => {
          const x = padding + i * stepX;
          const y = height - padding - (v / max) * (height - padding * 2);
          return (
            <g key={i}
               onMouseEnter={() => setHover({ x, y, i })}
               onMouseMove={() => setHover({ x, y, i })}>
              <circle cx={x} cy={y} r={4} fill="#2563eb" />
              <rect x={x - stepX / 2} y={padding} width={Math.max(stepX, 10)} height={height - padding * 2} fill="transparent" />
            </g>
          );
        })}
      </svg>
      {hover && (
        <div
          className="absolute z-10 px-2 py-1 text-xs rounded bg-black/80 text-white pointer-events-none"
          style={{ left: Math.max(0, hover.x - 20), top: Math.max(0, hover.y - 36) }}
        >
          <div>{labels[hover.i] || `Day ${hover.i + 1}`}</div>
          <div className="font-semibold">{data[hover.i]} issues</div>
        </div>
      )}
    </>
  );
};

const ChartBars: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
  const width = 320;
  const height = 140;
  const padding = 24;
  const max = Math.max(...data, 1);
  const barW = (width - padding * 2) / Math.max(data.length, 1) - 8;
  const [hover, setHover] = React.useState<{ x: number; y: number; i: number } | null>(null);
  return (
    <>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" onMouseLeave={() => setHover(null)}>
        {data.map((v, i) => {
          const x = padding + i * (barW + 8);
          const h = (v / max) * (height - padding * 2);
          const y = height - padding - h;
          return (
            <rect key={i} x={x} y={y} width={barW} height={h} fill="#0ea5e9" rx={4}
              onMouseMove={() => setHover({ x: x + barW / 2, y, i })}
              onMouseEnter={() => setHover({ x: x + barW / 2, y, i })}
            />
          );
        })}
      </svg>
      {hover && (
        <div
          className="absolute z-10 px-2 py-1 text-xs rounded bg-black/80 text-white pointer-events-none"
          style={{ left: Math.max(0, hover.x - 20), top: Math.max(0, hover.y - 36) }}
        >
          <div>{labels[hover.i] || `Item ${hover.i + 1}`}</div>
          <div className="font-semibold">{data[hover.i]} issues</div>
        </div>
      )}
    </>
  );
};

const ChartDonut: React.FC<{ values: number[]; colors: string[]; labels: string[] }> = ({ values, colors, labels }) => {
  const total = Math.max(values.reduce((a, b) => a + b, 0), 1);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const [hover, setHover] = React.useState<number | null>(null);
  return (
    <>
      <svg viewBox="0 0 120 120" className="w-full h-40" onMouseLeave={() => setHover(null)}>
        <g transform="translate(60,60)">
          {values.map((v, i) => {
            const frac = v / total;
            const len = circumference * frac;
            const el = (
              <circle
                key={i}
                r={radius}
                cx={0}
                cy={0}
                fill="transparent"
                stroke={colors[i]}
                strokeWidth={hover === i ? 16 : 14}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                onMouseEnter={() => setHover(i)}
              />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      {hover !== null && (
        <div className="absolute z-10 px-2 py-1 text-xs rounded bg-black/80 text-white pointer-events-none" style={{ right: 8, top: 8 }}>
          <div>{labels[hover]}</div>
          <div className="font-semibold">{values[hover]} ({Math.round((values[hover] / total) * 100)}%)</div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;