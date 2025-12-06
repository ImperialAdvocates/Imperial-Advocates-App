// hooks/useProfile.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      try {
        let user = null;

        try {
          const { data, error } = await supabase.auth.getUser();

          if (error) {
            console.warn('supabase.auth.getUser error:', error);
          } else {
            user = data?.user ?? null;
          }
        } catch (err) {
          if (err?.name === 'AuthSessionMissingError') {
            console.warn(
              'No auth session found (AuthSessionMissingError) – treating as logged out.'
            );
          } else {
            console.error('Unexpected getUser error:', err);
          }
        }

        if (!user) {
          if (!cancelled) {
            setProfile(null);
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        // 1) SELECT email as well
        const { data: rows, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, role, email')   // 👈 added email here
          .eq('id', user.id)
          .limit(1);

        if (profileError) {
          console.error('Error loading profile row:', profileError);
          if (!cancelled) {
            setProfile(null);
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        let row = rows?.[0];

        // 2) If no row yet, CREATE it with email
        if (!row) {
          const { data, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,                               // 👈 new
              username: user.email?.split('@')[0] ?? null,
              full_name: user.user_metadata?.full_name ?? null,
              role: 'user', // default
            })
            .select('id, username, full_name, role, email')     // 👈 include email
            .single();

          if (insertError) {
            console.error('Error inserting profile:', insertError);
            if (!cancelled) {
              setProfile(null);
              setIsAdmin(false);
              setLoading(false);
            }
            return;
          }

          row = data;
        }

        if (!cancelled) {
          setProfile(row);
          setIsAdmin(row.role === 'admin');
          setLoading(false);
          console.log('PROFILE LOADED', row);
        }
      } catch (err) {
        console.error('Unexpected error in useProfile:', err);
        if (!cancelled) {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, isAdmin, loading };
}