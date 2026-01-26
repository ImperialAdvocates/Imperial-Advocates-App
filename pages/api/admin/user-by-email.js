import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Missing Supabase env vars.');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const supabaseAdmin = getSupabaseAdmin();

    // Find profile row by email (case-insensitive)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username, full_name, role')
      .ilike('email', email)
      .limit(1);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ user: data?.[0] || null });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}