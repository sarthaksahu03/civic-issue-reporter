import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all grievances for admin
router.get('/grievances', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { status, category, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);
    
    const { data: grievances, error } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ grievances });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { data: grievances, error: grievanceError } = await supabase
      .from('grievances')
      .select('status, category, created_at');
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, created_at, role');

    if (grievanceError || userError) {
      return res.status(400).json({ 
        error: grievanceError?.message || userError?.message 
      });
    }

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      overview: {
        totalUsers: users.length,
        totalGrievances: grievances.length,
        adminUsers: users.filter(u => u.role === 'admin').length,
        citizenUsers: users.filter(u => u.role === 'citizen').length,
      },
      grievanceStats: {
        pending: grievances.filter(g => g.status === 'pending').length,
        inProgress: grievances.filter(g => g.status === 'in_progress').length,
        resolved: grievances.filter(g => g.status === 'resolved').length,
        rejected: grievances.filter(g => g.status === 'rejected').length,
      },
      recentActivity: {
        newUsersLastWeek: users.filter(u => new Date(u.created_at) >= lastWeek).length,
        newGrievancesLastWeek: grievances.filter(g => new Date(g.created_at) >= lastWeek).length,
        newUsersLastMonth: users.filter(u => new Date(u.created_at) >= lastMonth).length,
        newGrievancesLastMonth: grievances.filter(g => new Date(g.created_at) >= lastMonth).length,
      },
      categoryBreakdown: grievances.reduce((acc, g) => {
        acc[g.category] = (acc[g.category] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'citizen'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update grievance statuses
router.patch('/grievances/bulk-update', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { grievanceIds, status } = req.body;
    
    if (!Array.isArray(grievanceIds) || grievanceIds.length === 0) {
      return res.status(400).json({ error: 'Invalid grievance IDs' });
    }
    
    const { data: grievances, error } = await supabase
      .from('grievances')
      .update({ status })
      .in('id', grievanceIds)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ grievances });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
