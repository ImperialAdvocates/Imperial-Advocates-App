// pages/api/delete-account.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Missing server env vars' });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // We need the user making this request (from their access token)
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userId = userData.user.id;

    // Optional: clean up related rows (add any tables you want to purge)
    await admin.from('lesson_progress').delete().eq('user_id', userId);
    await admin.from('profiles').delete().eq('id', userId);

    // Delete auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      return res.status(400).json({ error: delErr.message });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Delete account error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}