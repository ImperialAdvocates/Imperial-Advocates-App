// hooks/useProfile.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // derived role helpers
  const role = (profile?.role || 'viewer').toLowerCase();
  const isAdmin = role === 'admin';
  const isInvestor = role === 'investor';
  const isViewer = role === 'viewer';

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      try {
        let user = null;

        try {
          const { data, error } = await supabase.auth.getUser();
          if (!error) user = data?.user ?? null;
        } catch (err) {
          if (err?.name !== 'AuthSessionMissingError') {
            console.error('Unexpected getUser error:', err);
          }
        }

        if (!user) {
          if (!cancelled) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // Load profile
        const { data: rows, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, role, email')
          .eq('id', user.id)
          .limit(1);

        if (profileError) {
          console.error('Error loading profile row:', profileError);
          if (!cancelled) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        let row = rows?.[0];

        // 🔍 DEBUG: see exactly what Supabase returns
console.log('PROFILE ROW FROM SUPABASE:', row);

        // If profile doesn't exist, create it
        if (!row) {
          const { data, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              username: user.email?.split('@')[0] ?? null,
              full_name: user.user_metadata?.full_name ?? null,
              role: 'viewer', // ✅ default role
            })
            .select('id, username, full_name, role, email')
            .single();

          if (insertError) {
            console.error('Error inserting profile:', insertError);
            if (!cancelled) {
              setProfile(null);
              setLoading(false);
            }
            return;
          }

          row = data;
        }

        if (!cancelled) {
          setProfile(row);
          setLoading(false);
          console.log('PROFILE LOADED', row);
        }
      } catch (err) {
        console.error('Unexpected error in useProfile:', err);
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    profile,
    role,
    isAdmin,
    isInvestor,
    isViewer,
    loading,
  };
}