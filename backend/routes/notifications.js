import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

// List notifications for a user
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ notifications: data });
});

// Mark a notification as read
router.patch('/:id/read', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ notification: data });
});

// Clear all notifications for a user
router.delete('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

export default router;
