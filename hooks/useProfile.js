// hooks/useProfile.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);

        // 1) Get the logged-in auth user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error getting auth user:', userError);
        }

        if (!user) {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // 2) Load ONLY the columns that actually exist in your table
        //    (id, username, role, maybe full_name)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, role') // 👈 match your table
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile row:', error);

          // Fallback: build a minimal profile from auth user
          if (mounted) {
            setProfile({
              id: user.id,
              email: user.email,
              username: user.email?.split('@')[0] || null,
              first_name: null,
              role: 'user', // fallback if table row can't be read
            });
          }
        } else if (mounted) {
          // Merge DB row with auth user info
          setProfile({
            ...data,
            email: user.email, // email comes from auth, not table
          });
        }
      } catch (err) {
        console.error('Unexpected useProfile error:', err);
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // 🔍 DEBUG: see what we actually got
  if (typeof window !== 'undefined') {
    console.log('useProfile profile:', profile);
  }

  return {
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
  };
}