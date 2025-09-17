import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

// Submit a new grievance
router.post('/', async (req, res) => {
  const { title, description, category, location, userId, status, latitude, longitude } = req.body;
  const payload = {
    title,
    description,
    category,
    location,
    user_id: userId,
    status: status || 'pending',
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
  res.json({ grievance: data[0] });
});

export default router;
