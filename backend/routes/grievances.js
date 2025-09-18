import express from 'express';
// Use the Supabase service role for backend operations to bypass RLS where appropriate
import supabase from '../supabaseAdminClient.js';

const router = express.Router();

// Submit a new grievance
router.post('/', async (req, res) => {
  const { title, description, category, location, userId, status, priority, latitude, longitude } = req.body;
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
    const { title, description, category, location, userId, status, priority, latitude, longitude, images = [], audio } = req.body;
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
    res.json({ grievance: data });
  } catch (err) {
    console.error('with-media error:', err);
    res.status(500).json({ error: 'Failed to submit grievance with media' });
  }
});

// List grievances with optional filters
router.get('/', async (req, res) => {
  const { userId, status, category } = req.query;
  let query = supabase.from('grievances').select('*');
  if (userId) query = query.eq('user_id', userId);
  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
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

export default router;
