import express from 'express';
import supabase from '../supabaseClient.js';
import supabaseAdmin from '../supabaseAdminClient.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign up user in Supabase Auth (uses anon key)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) return res.status(400).json({ error: error.message });

    const user = data.user;
    if (!user) return res.status(400).json({ error: 'Failed to create user' });

    // If email confirmation is enabled, Supabase returns no session and
    // the auth.users row might not be fully available for FK reference yet.
    const isConfirmed = Boolean(user.email_confirmed_at) || Boolean(data.session);
    let profile = null;

    if (isConfirmed) {
      const profilePayload = {
        id: user.id,
        email: user.email,
        full_name: name || user.user_metadata?.name || null,
        role: 'citizen',
      };
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert(profilePayload, { onConflict: 'id' });
      if (profileError) {
        // Not fatal for auth, but report it
        console.error('Profile upsert error:', profileError.message);
      } else {
        profile = profilePayload;
      }
    }

    return res.json({ user, session: data.session, profile });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const user = data.user;
    // Fetch user profile; if missing, create a basic one
    let { data: profile, error: profileFetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('id', user.id)
      .single();

    if (profileFetchError) {
      // Attempt to create profile
      const toInsert = { id: user.id, email: user.email, full_name: user.user_metadata?.name || null, role: 'citizen' };
      const { data: created, error: profileInsertError } = await supabaseAdmin
        .from('users')
        .insert(toInsert)
        .select()
        .single();
      if (!profileInsertError) profile = created;
    }

    return res.json({ user, session: data.session, profile });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
