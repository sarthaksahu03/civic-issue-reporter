import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { Loader2, CheckCircle2, XCircle, CircleDashed, Flame, Upload, Image as ImageIcon } from 'lucide-react';

const AdminGrievances: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resolveForId, setResolveForId] = useState<string | null>(null);
  const [rejectForId, setRejectForId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Category-specific problems and solutions for admins
  const resolveGuides: Record<string, Array<{ problem: string; solutions: string[] }>> = {
    garbage: [
      {
        problem: 'Garbage not collected regularly',
        solutions: [
          'Increase frequency of door-to-door collection or assign more trucks.',
          'Place community bins at proper points and ensure daily clearance.',
        ],
      },
      {
        problem: 'Open dumping of waste',
        solutions: [
          'Impose fines on violators and install monitoring at dumping hotspots.',
          'Provide designated dumping yards and run awareness campaigns about waste segregation.',
        ],
      },
    ],
    streetlight: [
      {
        problem: 'Broken or missing streetlights',
        solutions: [
          'Replace or repair faulty bulbs and poles promptly.',
          'Install solar-powered streetlights in areas with frequent power issues.',
        ],
      },
    ],
    water: [
      {
        problem: 'Contaminated water supply',
        solutions: [
          'Provide water tankers in affected areas until pipelines are cleaned.',
          'Send water testing teams to inspect pipelines and nearby industries for compliance.',
        ],
      },
      {
        problem: 'Waterlogging during rains',
        solutions: [
          'Regularly clean drains and construct proper stormwater systems.',
          'Deploy emergency pumping units in flood-prone areas during heavy rains.',
        ],
      },
    ],
    road: [
      {
        problem: 'Potholes on roads',
        solutions: [
          'Deploy repair teams for patchwork or resurfacing.',
          'Place warning signs and barriers until repairs are completed.',
        ],
      },
      {
        problem: 'Illegal parking and congestion',
        solutions: [
          'Deploy traffic police and issue fines to violators.',
          'Develop multi-level parking spaces and mark clear zones.',
        ],
      },
    ],
    air: [
      {
        problem: 'Poor air quality due to various sources',
        solutions: [
          'Conduct pollutant audits and enforce stricter emission checks.',
          'Promote plantation drives and monitor industrial emissions.',
        ],
      },
    ],
    sanitation: [
      {
        problem: 'Unclean or poorly maintained public toilets',
        solutions: [
          'Schedule regular cleaning and provide adequate supplies.',
          'Introduce community monitoring for accountability.',
        ],
      },
      {
        problem: 'Inadequate washroom facilities',
        solutions: [
          'Set up portable or modular toilets in high-traffic areas.',
          'Construct permanent, accessible washrooms with proper amenities.',
        ],
      },
      {
        problem: 'Lack of access to hygiene products and disposal facilities',
        solutions: [
          'Install vending machines for hygiene products in washrooms.',
          'Provide proper disposal mechanisms and regular collection systems.',
        ],
      },
    ],
  };

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

  // Convert selected proof images to base64
  const filesToBase64 = async (files: FileList): Promise<string[]> => {
    const tasks: Promise<string>[] = Array.from(files).map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }));
    return Promise.all(tasks);
  };

  const submitResolveWithProof = async () => {
    if (!resolveForId || !proofFiles || proofFiles.length === 0) return;
    setSubmittingAction(true);
    try {
      const images = await filesToBase64(proofFiles);
      const res = await apiService.resolveWithProof(resolveForId, images);
      if (res.success && (res.data as any)?.grievance) {
        setItems(prev => prev.map(g => g.id === resolveForId ? (res.data as any).grievance : g));
        setResolveForId(null);
        setProofFiles(null);
      } else {
        alert((res as any).error || 'Failed to resolve with proof');
      }
    } catch (e) {
      alert('Failed to upload proof');
    } finally {
      setSubmittingAction(false);
    }
  };

  const submitRejectWithReason = async () => {
    if (!rejectForId || !rejectReason.trim()) return;
    setSubmittingAction(true);
    try {
      const res = await apiService.rejectGrievanceWithReason(rejectForId, rejectReason.trim());
      if (res.success && (res.data as any)?.grievance) {
        setItems(prev => prev.map(g => g.id === rejectForId ? (res.data as any).grievance : g));
        setRejectForId(null);
        setRejectReason('');
      } else {
        alert((res as any).error || 'Failed to reject grievance');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const grouped = useMemo(() => {
    const byCat: Record<string, any[]> = {};
    items.forEach((g) => {
      const key = String(g.category || 'others');
      if (!byCat[key]) byCat[key] = [];
      byCat[key].push(g);
    });
    // sort categories alphabetically for consistent UI
    const keys = Object.keys(byCat).sort((a, b) => a.localeCompare(b));
    return { byCat, keys };
  }, [items]);

  return (<>
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
          <div className="space-y-8">
            {grouped.keys.map((cat) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold capitalize">{cat}</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{grouped.byCat[cat].length} issues</span>
                </div>
                <div className="space-y-4">
                  {grouped.byCat[cat].map((g) => (
                    <div key={g.id} className="bg-surface dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-md p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{g.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{String(g.status).replace('_','-')}</span>
                            {g.priority === 'high' && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                <Flame className="h-3 w-3"/> Priority
                              </span>
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
                          {/* Ways to Resolve - category specific */}
                          {(() => {
                            const rawCat = String(g.category || '').toLowerCase();
                            const cat: string = rawCat === 'noise' ? 'air' : rawCat; // legacy mapping
                            const guide = resolveGuides[cat];
                            if (!guide || guide.length === 0) return null;
                            return (
                              <div className="mt-4 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/20 p-4">
                                <h4 className="font-semibold mb-2">Ways to Resolve</h4>
                                <div className="space-y-3">
                                  {guide.map((item, idx) => (
                                    <div key={idx} className="">
                                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Problem: {item.problem}</p>
                                      <ul className="list-disc pl-5 mt-1 text-sm text-slate-700 dark:text-slate-300">
                                        {item.solutions.map((s, i) => (
                                          <li key={i}>Solution {i+1}: {s}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-2">
                          {String(g.status) === 'resolved' ? (
                            <span className="px-3 py-2 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4"/> Completed
                            </span>
                          ) : (
                            <>
                              <button disabled={updatingId===g.id} onClick={() => setStatus(g.id, 'in_progress')} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"><CircleDashed className="h-4 w-4"/> In progress</button>
                              <button disabled={updatingId===g.id} onClick={() => setResolveForId(g.id)} className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/> Resolve</button>
                              <button disabled={updatingId===g.id} onClick={() => setRejectForId(g.id)} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 disabled:opacity-50"><XCircle className="h-4 w-4"/> Reject</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Resolve Modal */}
    {resolveForId && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 rounded-md p-6 w-full max-w-lg">
          <h3 className="text-lg font-semibold mb-3">Upload proof images</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">At least one image is required to resolve this grievance.</p>
          <div className="flex items-center gap-2 mb-4">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md cursor-pointer">
              <Upload className="h-4 w-4"/> Choose images
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setProofFiles(e.target.files)} />
            </label>
            {(proofFiles?.length ?? 0) > 0 && (
              <span className="text-sm text-slate-600 dark:text-slate-300 inline-flex items-center gap-1"><ImageIcon className="h-4 w-4"/> {proofFiles?.length ?? 0} selected</span>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setResolveForId(null); setProofFiles(null); }} className="px-3 py-2 rounded-md bg-slate-200 dark:bg-slate-700">Cancel</button>
            <button onClick={submitResolveWithProof} disabled={submittingAction || (proofFiles?.length ?? 0) === 0} className="px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50">{submittingAction ? 'Submitting...' : 'Submit & Resolve'}</button>
          </div>
        </div>
      </div>
    )}

    {/* Reject Modal */}
    {rejectForId && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 rounded-md p-6 w-full max-w-lg">
          <h3 className="text-lg font-semibold mb-3">Provide rejection justification</h3>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} className="w-full mb-4" placeholder="Explain why this grievance is being rejected/cancelled" />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setRejectForId(null); setRejectReason(''); }} className="px-3 py-2 rounded-md bg-slate-200 dark:bg-slate-700">Cancel</button>
            <button onClick={submitRejectWithReason} disabled={submittingAction || !rejectReason.trim()} className="px-3 py-2 rounded-md bg-red-600 text-white disabled:opacity-50">{submittingAction ? 'Submitting...' : 'Submit & Reject'}</button>
          </div>
        </div>
      </div>
    )}
  </>);
};

export default AdminGrievances;
