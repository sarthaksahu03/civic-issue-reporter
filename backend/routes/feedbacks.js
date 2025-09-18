import express from 'express';
import supabase from '../supabaseAdminClient.js';

const router = express.Router();

// Create feedback for a resolved grievance
router.post('/', async (req, res) => {
  try {
    const { grievanceId, userId, rating, comments } = req.body;
    if (!grievanceId || !rating) {
      return res.status(400).json({ error: 'grievanceId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be 1-5' });
    }

    // Optional: enforce only once per grievance per user
    const { data: existing, error: existErr } = await supabase
      .from('feedbacks')
      .select('id')
      .eq('grievance_id', grievanceId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existErr) {
      console.warn('feedback existing check error', existErr.message);
    } else if (existing) {
      return res.status(400).json({ error: 'Feedback already submitted' });
    }

    const payload = {
      grievance_id: grievanceId,
      user_id: userId || null,
      rating,
      comments: comments || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('feedbacks')
      .insert([payload])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ feedback: data });
  } catch (e) {
    console.error('feedback create error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: list all feedbacks (with grievance info)
router.get('/admin', async (_req, res) => {
  try {
    // TODO: add admin auth middleware
    const { data, error } = await supabase
      .from('feedbacks')
      .select('id, grievance_id, user_id, rating, comments, created_at');
    if (error) return res.status(400).json({ error: error.message });

    // Optionally join grievances for title/status
    const grievanceIds = [...new Set(data.map(f => f.grievance_id).filter(Boolean))];
    let grievancesById = {};
    if (grievanceIds.length) {
      const { data: grievances, error: gErr } = await supabase
        .from('grievances')
        .select('id, title, status, category, user_id')
        .in('id', grievanceIds);
      if (!gErr && grievances) {
        grievancesById = grievances.reduce((acc, g) => { acc[g.id] = g; return acc; }, {});
      }
    }

    const enriched = data.map(f => ({ ...f, grievance: grievancesById[f.grievance_id] || null }));
    return res.json({ feedbacks: enriched });
  } catch (e) {
    console.error('feedback admin list error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
