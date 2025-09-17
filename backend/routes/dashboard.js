import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (userId) {
      // Citizen dashboard stats
      const { data: userGrievances, error: grievanceError } = await supabase
        .from('grievances')
        .select('status')
        .eq('user_id', userId);
      
      if (grievanceError) {
        return res.status(400).json({ error: grievanceError.message });
      }

      const stats = {
        totalGrievances: userGrievances.length,
        pendingGrievances: userGrievances.filter(g => g.status === 'pending').length,
        inProgressGrievances: userGrievances.filter(g => g.status === 'in_progress').length,
        resolvedGrievances: userGrievances.filter(g => g.status === 'resolved').length,
        rejectedGrievances: userGrievances.filter(g => g.status === 'rejected').length,
      };

      res.json({ stats });
    } else {
      // Admin dashboard stats
      const { data: allGrievances, error: grievanceError } = await supabase
        .from('grievances')
        .select('status, category, created_at');
      
      const { data: allUsers, error: userError } = await supabase
        .from('users')
        .select('id, created_at');

      if (grievanceError || userError) {
        return res.status(400).json({ 
          error: grievanceError?.message || userError?.message 
        });
      }

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats = {
        totalUsers: allUsers.length,
        totalGrievances: allGrievances.length,
        pendingGrievances: allGrievances.filter(g => g.status === 'pending').length,
        inProgressGrievances: allGrievances.filter(g => g.status === 'in_progress').length,
        resolvedGrievances: allGrievances.filter(g => g.status === 'resolved').length,
        rejectedGrievances: allGrievances.filter(g => g.status === 'rejected').length,
        newUsersThisMonth: allUsers.filter(u => new Date(u.created_at) >= thisMonth).length,
        newGrievancesThisMonth: allGrievances.filter(g => new Date(g.created_at) >= thisMonth).length,
        categoryBreakdown: allGrievances.reduce((acc, g) => {
          acc[g.category] = (acc[g.category] || 0) + 1;
          return acc;
        }, {}),
      };

      res.json({ stats });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent grievances
router.get('/recent', async (req, res) => {
  try {
    const { userId, limit = 5 } = req.query;
    
    let query = supabase
      .from('grievances')
      .select('id, title, status, category, created_at, location')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: grievances, error } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ grievances });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
