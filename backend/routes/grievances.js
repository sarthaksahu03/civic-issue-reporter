import express from 'express';
// Use the Supabase service role for backend operations to bypass RLS where appropriate
import supabase from '../supabaseAdminClient.js';

const router = express.Router();

// Basic geocoding with resilience. Supports:
// - Disable via GEOCODING_DISABLED=true
// - Provider selection: GEOCODING_PROVIDER = 'nominatim' | 'opencage'
// - OpenCage key via OPENCAGE_API_KEY
// - Timeout and retries to avoid hanging/ETIMEDOUT spam
const GEOCODING_DISABLED = String(process.env.GEOCODING_DISABLED || '').toLowerCase() === 'true';
const GEOCODING_PROVIDER = (process.env.GEOCODING_PROVIDER || 'nominatim').toLowerCase();
const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY || '';
let lastGeoLogAt = 0;
function logGeoOncePer(minMs, level, ...args) {
  const now = Date.now();
  if (now - lastGeoLogAt > minMs) {
    lastGeoLogAt = now;
    console[level](...args);
  }
}

async function geocodeLocation(address) {
  if (GEOCODING_DISABLED) return null;
  try {
    if (!address || String(address).trim().length === 0) return null;

    const fetchWithTimeout = async (urlStr, options = {}, timeoutMs = 5000) => {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        return await fetch(urlStr, { ...options, signal: ctrl.signal });
      } finally {
        clearTimeout(id);
      }
    };

    const nominatimQuery = async (q) => {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('q', q);
      url.searchParams.set('limit', '1');
      const resp = await fetchWithTimeout(url.toString(), {
        headers: { 'User-Agent': 'civic-issue-reporter/1.0 (public use)' },
      }, 5000);
      if (!resp.ok) return null;
      const json = await resp.json();
      if (Array.isArray(json) && json.length > 0) {
        const first = json[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) return { latitude: lat, longitude: lon };
      }
      return null;
    };

    const openCageQuery = async (q) => {
      if (!OPENCAGE_API_KEY) return null;
      const url = new URL('https://api.opencagedata.com/geocode/v1/json');
      url.searchParams.set('q', q);
      url.searchParams.set('key', OPENCAGE_API_KEY);
      url.searchParams.set('limit', '1');
      url.searchParams.set('no_annotations', '1');
      const resp = await fetchWithTimeout(url.toString(), {}, 5000);
      if (!resp.ok) return null;
      const json = await resp.json();
      const result = json && Array.isArray(json.results) && json.results[0];
      if (result && result.geometry) {
        const lat = parseFloat(result.geometry.lat);
        const lon = parseFloat(result.geometry.lng);
        if (Number.isFinite(lat) && Number.isFinite(lon)) return { latitude: lat, longitude: lon };
      }
      return null;
    };

    const queriesInOrder = async (q) => {
      if (GEOCODING_PROVIDER === 'opencage') {
        return (await openCageQuery(q)) || (await openCageQuery(`${q}, India`)) || (await nominatimQuery(q)) || (await nominatimQuery(`${q}, India`));
      }
      // default: nominatim first
      return (await nominatimQuery(q)) || (await nominatimQuery(`${q}, India`)) || (await openCageQuery(q)) || (await openCageQuery(`${q}, India`));
    };

    // Retry up to 2 times with backoff
    let attempt = 0;
    const maxAttempts = 3;
    let lastError = null;
    while (attempt < maxAttempts) {
      try {
        const coords = await queriesInOrder(address);
        if (coords) return coords;
        break; // no result, don't retry further
      } catch (e) {
        lastError = e;
        const backoff = 300 * Math.pow(2, attempt); // 300, 600, 1200ms
        await new Promise(r => setTimeout(r, backoff));
      }
      attempt++;
    }
    if (lastError) logGeoOncePer(60_000, 'warn', 'geocodeLocation error (last attempt)', lastError);
    return null;
  } catch (e) {
    logGeoOncePer(60_000, 'warn', 'geocodeLocation error', e);
    return null;
  }
}

// Haversine distance in kilometers between two lat/lng points
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// After creating a grievance, check for cluster of same-category issues within 2km radius
// If count >= 3, set priority to 'high' for those grievances and notify admins
async function checkClusterAndNotify(newGrievance) {
  try {
    const { category, latitude, longitude } = newGrievance || {};
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !category) return;

    // Fetch nearby grievances of the same category with coordinates
    const { data: sameCat, error } = await supabase
      .from('grievances')
      .select('id, latitude, longitude, category, priority')
      .eq('category', category)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    if (error || !Array.isArray(sameCat)) return;

    // Filter within 2km
    const RADIUS_KM = 2;
    const nearby = sameCat.filter((g) => haversineKm(latitude, longitude, g.latitude, g.longitude) <= RADIUS_KM);
    if (nearby.length >= 3) {
      const ids = nearby.map((g) => g.id);
      // Update priority to high for these grievances
      await supabase.from('grievances').update({ priority: 'high' }).in('id', ids);

      // Notify all admins
      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
      if (admins && admins.length) {
        const title = 'Priority cluster detected';
        const message = `There are ${nearby.length} or more '${category}' issues within 2km. These have been marked as priority.`;
        const notifications = admins.map((a) => ({
          user_id: a.id,
          title,
          message,
          type: 'warning',
          created_at: new Date().toISOString(),
        }));
        await supabase.from('notifications').insert(notifications);
      }
    }
  } catch (e) {
    console.error('checkClusterAndNotify error', e);
  }
}

// Submit a new grievance
router.post('/', async (req, res) => {
  let { title, description, category, location, userId, status, priority, latitude, longitude } = req.body;
  // Normalize categories: rename legacy 'noise' to 'air'
  if (category === 'noise') category = 'air';
  const payload = {
    title,
    description,
    category,
    location,
    user_id: userId,
    status: status || 'pending',
    priority: priority || 'medium',
    created_at: new Date().toISOString(),
  };

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    // These columns should exist in the DB. See supabase.schema.sql changes.
    payload.latitude = latitude;
    payload.longitude = longitude;
  }

  const { data, error } = await supabase
    .from('grievances')
    .insert([payload])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  // Auto-check cluster and notify admins
  checkClusterAndNotify(data);
  // Best-effort async geocoding if coords missing but we have an address
  if ((!data.latitude || !data.longitude) && data.location) {
    geocodeLocation(data.location).then(async (coords) => {
      try {
        if (coords) {
          await supabase
            .from('grievances')
            .update({ latitude: coords.latitude, longitude: coords.longitude })
            .eq('id', data.id);
        }
      } catch (e) {
        console.error('post / geocode update error', e);
      }
    });
  }
  res.json({ grievance: data });
});

// Helper: upload a base64 data URL to Supabase Storage and return public URL
async function uploadDataUrl(bucket, path, dataUrl) {
  try {
    const match = /^data:(.+);base64,(.*)$/.exec(dataUrl || '');
    if (!match) throw new Error('Invalid data URL');
    const contentType = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');
    const { data: up, error: upErr } = await supabase.storage.from(bucket).upload(path, buffer, { contentType, upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return pub.publicUrl;
  } catch (e) {
    console.error('uploadDataUrl error:', e);
    return null;
  }
}

// Submit grievance with media (expects base64 data URLs for images/audio)
router.post('/with-media', async (req, res) => {
  try {
    let { title, description, category, location, userId, status, priority, latitude, longitude, images = [], audio } = req.body;
    // Normalize categories: rename legacy 'noise' to 'air'
    if (category === 'noise') category = 'air';
    const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'grievance-media';

    const timestamp = Date.now();
    const prefix = `${userId || 'anon'}/${timestamp}`;

    const imageUrls = [];
    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const url = await uploadDataUrl(BUCKET, `${prefix}/image_${i + 1}.jpg`, images[i]);
        if (url) imageUrls.push(url);
      }
    }

    let audioUrl = null;
    if (audio) {
      // Try to preserve mime from data URL
      const match = /^data:(.+);base64,/.exec(audio);
      const mime = match && match[1] ? match[1] : '';
      let ext = 'webm';
      if (mime.includes('mpeg')) ext = 'mp3';
      else if (mime.includes('wav')) ext = 'wav';
      else if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) ext = 'm4a';
      audioUrl = await uploadDataUrl(BUCKET, `${prefix}/audio.${ext}`, audio);
    }

    const payload = {
      title,
      description,
      category,
      location,
      user_id: userId,
      status: status || 'pending',
      priority: priority || 'medium',
      created_at: new Date().toISOString(),
    };
    // Only include media fields if present to avoid schema errors when columns are missing
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      payload.image_urls = imageUrls;
    }
    if (audioUrl) {
      payload.audio_url = audioUrl;
    }
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    const { data, error } = await supabase
      .from('grievances')
      .insert([payload])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    // Auto-check cluster and notify admins
    checkClusterAndNotify(data);
    // Best-effort async geocoding if coords missing but we have an address
    if ((!data.latitude || !data.longitude) && data.location) {
      geocodeLocation(data.location).then(async (coords) => {
        try {
          if (coords) {
            await supabase
              .from('grievances')
              .update({ latitude: coords.latitude, longitude: coords.longitude })
              .eq('id', data.id);
          }
        } catch (e) {
          console.error('post /with-media geocode update error', e);
        }
      });
    }
    res.json({ grievance: data });
  } catch (err) {
    console.error('with-media error:', err);
    res.status(500).json({ error: 'Failed to submit grievance with media' });
  }
});

// List resolved grievances that are missing coordinates (admin helper)
router.get('/resolved-missing-coords', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .select('id, title, location, status, latitude, longitude, created_at')
      .eq('status', 'resolved')
      .or('latitude.is.null,longitude.is.null');
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ items: data });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually set coordinates for a grievance (admin helper)
router.patch('/:id/coords', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body || {};
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }
    const { data, error } = await supabase
      .from('grievances')
      .update({ latitude: lat, longitude: lon })
      .eq('id', id)
      .select();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ grievance: data && data[0] });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Re-geocode a specific grievance by id, optionally with a better query
router.post('/:id/geocode', async (req, res) => {
  try {
    const { id } = req.params;
    const customQuery = req.body?.query;
    // Fetch grievance
    const { data: rows, error } = await supabase
      .from('grievances')
      .select('id, location')
      .eq('id', id)
      .limit(1);
    if (error) return res.status(400).json({ error: error.message });
    const g = rows && rows[0];
    if (!g) return res.status(404).json({ error: 'Not found' });
    const query = (customQuery && String(customQuery).trim().length > 0) ? customQuery : g.location;
    if (!query) return res.status(400).json({ error: 'No query or stored location to geocode' });
    const coords = await geocodeLocation(query);
    if (!coords) return res.status(404).json({ error: 'Geocoding failed' });
    const { data: up, error: upErr } = await supabase
      .from('grievances')
      .update({ latitude: coords.latitude, longitude: coords.longitude })
      .eq('id', id)
      .select();
    if (upErr) return res.status(400).json({ error: upErr.message });
    return res.json({ grievance: up && up[0] });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// List grievances with optional filters
router.get('/', async (req, res) => {
  const { userId, status } = req.query;
  let { category } = req.query;
  let query = supabase.from('grievances').select('*');
  if (userId) query = query.eq('user_id', userId);
  if (status) query = query.eq('status', status);
  if (category) {
    // If filtering for 'air', include legacy 'noise' rows as well
    if (category === 'air') {
      query = query.in('category', ['air', 'noise']);
    } else if (category === 'noise') {
      // Map legacy filter to new category
      query = query.eq('category', 'air');
    } else {
      query = query.eq('category', category);
    }
  }
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ grievances: data });
});

// Update grievance status (admin only)
router.patch('/:id/status', async (req, res) => {
  // In production, check admin role from Supabase JWT or user profile
  const { id } = req.params;
  const { status } = req.body;
  // TODO: Add admin check here
  const { data, error } = await supabase.from('grievances').update({ status }).eq('id', id).select();
  if (error) return res.status(400).json({ error: error.message });

  const updated = data && data[0];
  // If no coords but we have a location string, geocode now so this item appears on the public map
  if (updated && (!updated.latitude || !updated.longitude) && updated.location) {
    try {
      const coords = await geocodeLocation(updated.location);
      if (coords) {
        await supabase
          .from('grievances')
          .update({ latitude: coords.latitude, longitude: coords.longitude })
          .eq('id', updated.id);
        // reflect coords in response object
        updated.latitude = coords.latitude;
        updated.longitude = coords.longitude;
      }
    } catch (e) {
      console.error('status patch geocode error', e);
    }
  }
  // Send notification to the grievance owner
  if (updated && updated.user_id) {
    const title = 'Grievance status updated';
    const message = `Your grievance "${updated.title}" status changed to ${status}.`;
    await supabase.from('notifications').insert([{
      user_id: updated.user_id,
      title,
      message,
      type: status === 'resolved' ? 'success' : (status === 'rejected' ? 'error' : 'info')
    }]);
  }

  res.json({ grievance: updated });
});

// Resolve a grievance with mandatory proof images (admin only)
router.post('/:id/resolve-with-proof', async (req, res) => {
  try {
    const { id } = req.params;
    const { images = [] } = req.body; // base64 data URLs
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one proof image is required' });
    }

    const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'grievance-media';
    const timestamp = Date.now();
    const prefix = `proofs/${id}/${timestamp}`;

    const proofUrls = [];
    for (let i = 0; i < images.length; i++) {
      const url = await uploadDataUrl(BUCKET, `${prefix}/proof_${i + 1}.jpg`, images[i]);
      if (url) proofUrls.push(url);
    }
    if (proofUrls.length === 0) {
      return res.status(500).json({ error: 'Failed to upload proof images' });
    }

    const { data, error } = await supabase
      .from('grievances')
      .update({ status: 'resolved', resolution_proof_urls: proofUrls })
      .eq('id', id)
      .select();
    if (error) return res.status(400).json({ error: error.message });
    const updated = data && data[0];

    if (updated && updated.user_id) {
      await supabase.from('notifications').insert([{
        user_id: updated.user_id,
        title: 'Grievance resolved',
        message: `Your grievance "${updated.title}" was marked resolved. Proof uploaded for transparency.`,
        type: 'success',
        created_at: new Date().toISOString(),
      }]);
    }

    return res.json({ grievance: updated });
  } catch (e) {
    console.error('resolve-with-proof error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject/cancel a grievance with mandatory justification (admin only)
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || String(reason).trim().length === 0) {
      return res.status(400).json({ error: 'Rejection justification is required' });
    }

    const { data, error } = await supabase
      .from('grievances')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .select();
    if (error) return res.status(400).json({ error: error.message });
    const updated = data && data[0];

    if (updated && updated.user_id) {
      await supabase.from('notifications').insert([{
        user_id: updated.user_id,
        title: 'Grievance rejected',
        message: `Your grievance "${updated.title}" was rejected. Reason: ${reason}`,
        type: 'error',
        created_at: new Date().toISOString(),
      }]);
    }

    return res.json({ grievance: updated });
  } catch (e) {
    console.error('reject grievance error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Public gallery of resolution proofs
router.get('/public-gallery', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .select('id, title, category, resolution_proof_urls, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    const items = (data || []).filter((g) => Array.isArray(g.resolution_proof_urls) && g.resolution_proof_urls.length > 0);
    return res.json({ items });
  } catch (e) {
    console.error('public-gallery error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Emergency reporting (urgent issues)
router.post('/emergency', async (req, res) => {
  try {
    let { title, description, category, location, userId, latitude, longitude } = req.body;
    if (category === 'noise') category = 'air';
    const payload = {
      title: title || 'Emergency Report',
      description,
      category: category || 'emergency',
      location: location || null,
      user_id: userId || null,
      status: 'pending',
      priority: 'high',
      created_at: new Date().toISOString(),
    };
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    const { data: grievance, error } = await supabase
      .from('grievances')
      .insert([payload])
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    // Notify all admins immediately
    const { data: admins, error: adminErr } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');
    if (!adminErr && admins && admins.length) {
      const messages = admins.map(a => ({
        user_id: a.id,
        title: 'Emergency reported',
        message: `URGENT: ${grievance.title} (${grievance.category}). Please review immediately.`,
        type: 'warning',
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(messages);
    }

    return res.json({ grievance });
  } catch (e) {
    console.error('emergency report error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Public map data: return geocoded grievances and status
router.get('/public-map', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('grievances')
      .select('id, title, status, category, latitude, longitude, created_at, location')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ items: data });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin backfill: geocode grievances with missing coordinates
// NOTE: In production, protect this route (authz). For now, it's open for dev convenience.
router.post('/backfill-geocode', async (req, res) => {
  try {
    const BATCH_LIMIT = Math.min(Number(req.body?.limit) || 50, 200);
    // Fetch grievances missing either coordinate but having a location string
    const { data: rows, error } = await supabase
      .from('grievances')
      .select('id, location, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .not('location', 'is', null)
      .limit(BATCH_LIMIT);
    if (error) return res.status(400).json({ error: error.message });

    const updatedIds = [];
    const skipped = [];

    // polite rate limit to Nominatim: ~1 req/sec
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (const row of rows || []) {
      try {
        if (!row.location) {
          skipped.push(row.id);
          continue;
        }
        const coords = await geocodeLocation(row.location);
        if (coords) {
          const { error: upErr } = await supabase
            .from('grievances')
            .update({ latitude: coords.latitude, longitude: coords.longitude })
            .eq('id', row.id);
          if (!upErr) updatedIds.push(row.id);
        } else {
          skipped.push(row.id);
        }
      } catch (e) {
        skipped.push(row.id);
      }
      // wait a bit between requests
      await sleep(1100);
    }

    return res.json({ updatedCount: updatedIds.length, updatedIds, skippedCount: skipped.length });
  } catch (e) {
    console.error('backfill-geocode error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
