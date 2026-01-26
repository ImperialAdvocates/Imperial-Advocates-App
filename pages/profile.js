// pages/profile.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from '../hooks/useProfile';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading: profileLoading, isAdmin } = useProfile();

  // ✅ Use columns that exist in your profiles table:
  // full_name, username, email, role, created_at
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setUsername(profile.username || '');
  }, [profile]);

  const displayName = useMemo(() => {
    const n = (fullName || '').trim();
    if (n) return n;
    const u = (username || '').trim();
    if (u) return u;
    return profile?.email ? profile.email.split('@')[0] : 'Investor';
  }, [fullName, username, profile?.email]);

  const displayInitials = useMemo(() => {
    const n = (fullName || '').trim();
    if (n) {
      const parts = n.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] || '';
      const last = (parts.length > 1 ? parts[parts.length - 1][0] : '') || '';
      const initials = (first + last).toUpperCase();
      return initials || (profile?.email ? profile.email[0].toUpperCase() : 'IA');
    }
    if ((username || '').trim()) return username.trim()[0].toUpperCase();
    if (profile?.email) return profile.email[0].toUpperCase();
    return 'IA';
  }, [fullName, username, profile?.email]);

  const roleLabel = useMemo(() => {
    if (isAdmin) return 'Admin / Team';
    const r = (profile?.role || 'viewer').toLowerCase();
    if (r === 'investor') return 'Investor';
    if (r === 'viewer') return 'Viewer';
    return r.charAt(0).toUpperCase() + r.slice(1);
  }, [isAdmin, profile?.role]);

  const isSuccess = status && status.toLowerCase().includes('success');

  async function handleSave(e) {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setStatus('');

      const payload = {
        full_name: fullName.trim() || null,
        username: username.trim() || null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id)
        .select('id, full_name, username')
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        setStatus(`Could not save changes: ${error.message}`);
        return;
      }

      console.log('Profile updated:', data);
      setStatus('Profile updated successfully.');
    } catch (err) {
      console.error('Unexpected save error:', err);
      setStatus(`Could not save changes: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleDeleteAccount() {
    const ok = window.confirm(
      'Delete your account permanently? This cannot be undone.'
    );
    if (!ok) return;

    try {
      setSaving(true);
      setStatus('');

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setStatus('No active session found. Please sign in again.');
        return;
      }

      const resp = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await resp.json();
      if (!resp.ok) {
        setStatus(`Could not delete account: ${json?.error || 'Unknown error'}`);
        return;
      }

      await supabase.auth.signOut();
      router.push('/');
    } catch (e) {
      console.error(e);
      setStatus(`Could not delete account: ${e?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  if (profileLoading && !profile) {
    return (
      <div className="profile-screen">
        <div className="profile-inner">
          <section className="profile-header-card profile-header-card--loading">
            <div className="profile-header-left">
              <div className="profile-avatar skeleton" />
              <div className="profile-header-text">
                <div className="profile-kicker">ACCOUNT • PROFILE</div>
                <h1 className="profile-name">Loading profile…</h1>
              </div>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-screen">
        <div className="profile-inner">
          <section className="profile-header-card profile-header-card--error">
            <div className="profile-header-left">
              <div className="profile-avatar">
                <span>IA</span>
              </div>
              <div className="profile-header-text">
                <div className="profile-kicker">ACCOUNT • PROFILE</div>
                <h1 className="profile-name">Could not load profile</h1>
                <div className="profile-email">Please refresh and try again.</div>
              </div>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="profile-inner">
        {/* HEADER CARD */}
        <section className="profile-header-card">
          <div className="profile-header-left">
            <div className="profile-avatar">
              <span>{displayInitials}</span>
            </div>

            <div className="profile-header-text">
              <div className="profile-kicker">ACCOUNT • PROFILE</div>

              <div className="profile-name-row">
                <h1 className="profile-name">Hi, {displayName}</h1>
                {isAdmin && <span className="role-pill">ADMIN</span>}
              </div>

              <div className="profile-email">{profile.email}</div>
            </div>
          </div>

          <button type="button" className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </section>

        {/* GRID */}
        <div className="profile-grid">
          {/* PERSONAL DETAILS */}
          <section className="profile-card">
            <h2 className="card-title">Personal details</h2>
            <p className="card-sub">
              Update how your details appear across the Imperial Advocates portal.
            </p>

            <form onSubmit={handleSave} className="profile-form">
              <label className="field">
                <span className="field-label">Full name</span>
                <input
                  type="text"
                  className="field-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Akshat Sharma"
                />
              </label>

              <label className="field">
                <span className="field-label">Username</span>
                <input
                  type="text"
                  className="field-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="akshat_sharma"
                />
                <span className="field-help">
                  Used in greetings like “Welcome back, {username || 'investor'}”.
                </span>
              </label>

              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>

              {status && (
                <p
                  className={`status-text ${
                    isSuccess ? 'status-success' : 'status-error'
                  }`}
                >
                  {status}
                </p>
              )}
            </form>
          </section>

          {/* ACCOUNT */}
          <section className="profile-card">
            <h2 className="card-title">Account</h2>
            <p className="card-sub">Your login and membership information.</p>

            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{profile.email}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-value">{roleLabel}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Member since</span>
              <span className="info-value">
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-AU')
                  : '—'}
              </span>
            </div>

            <a
              href="mailto:team@imperialadvocates.com"
              className="secondary-btn full-width"
            >
              Contact support
            </a>

            <button
              type="button"
              className="danger-btn full-width"
              onClick={handleDeleteAccount}
              disabled={saving}
            >
              {saving ? 'Please wait…' : 'Delete account'}
            </button>
          </section>
        </div>

        <div className="profile-bottom-safe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .profile-screen {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .profile-inner {
    width: 100%;
    max-width: 520px;
    padding: 12px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* HEADER CARD – TEXTURED GREEN */
  .profile-header-card {
    border-radius: 22px;
    padding: 14px 18px;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    background-image:
      linear-gradient(135deg, rgba(11, 46, 35, 0.82), rgba(15, 61, 46, 0.70)),
      url('/bg/ia-texture.png');
    background-size: cover, cover;
    background-position: center, center;
    background-repeat: no-repeat, no-repeat;

    position: relative;
    overflow: hidden;

    box-shadow: var(--shadow-brand);
    border: 1px solid rgba(255, 255, 255, 0.14);
  }

  .profile-header-card--loading,
  .profile-header-card--error {
    opacity: 0.95;
  }

  .profile-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .profile-avatar {
    width: 48px;
    height: 48px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.24);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 900;
    box-shadow: 0 12px 30px rgba(0,0,0,0.18);
  }

  .profile-avatar.skeleton {
    opacity: 0.5;
  }

  .profile-header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .profile-kicker {
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .profile-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .profile-name {
    margin: 0;
    font-size: 20px;
    font-weight: 900;
  }

  .role-pill {
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.55);
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(8px);
  }

  .profile-email {
    font-size: 13px;
    opacity: 0.92;
  }

  /* LOGOUT BUTTON */
  .logout-btn {
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 800;
    background: rgba(0,0,0,0.22);
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 14px 30px rgba(0,0,0,0.18);
    white-space: nowrap;
    backdrop-filter: blur(10px);
  }

  .logout-btn:hover {
    opacity: 0.96;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .profile-card {
    border-radius: 22px;
    padding: 14px 16px 16px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(15, 23, 42, 0.10);
    box-shadow: var(--shadow-brand);
  }

  .card-title {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 800;
    color: #111827;
  }

  .card-sub {
    margin: 0 0 12px;
    font-size: 13px;
    color: #6b7280;
  }

  .profile-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #6b7280;
  }

  .field-input {
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.14);
    background: rgba(255, 255, 255, 0.92);
    color: #111827;
    padding: 9px 12px;
    font-size: 13px;
    outline: none;
  }

  .field-input:focus {
    border-color: rgba(15, 61, 46, 0.55);
    box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.12);
    background: #ffffff;
  }

  .field-help {
    font-size: 11px;
    color: #6b7280;
  }

  /* PRIMARY BUTTON – TEXTURED GREEN */
  .primary-btn {
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 800;
    color: #ffffff;
    cursor: pointer;
    margin-top: 4px;
    box-shadow: var(--shadow-brand);
    align-self: flex-start;

    background-image:
      linear-gradient(135deg, rgba(11, 46, 35, 0.82), rgba(15, 61, 46, 0.70)),
      url('/bg/ia-texture.png');
    background-size: cover, cover;
    background-position: center, center;
    background-repeat: no-repeat, no-repeat;
  }

  .primary-btn[disabled] {
    opacity: 0.75;
    cursor: default;
    box-shadow: none;
  }

  .status-text {
    margin: 6px 0 0;
    font-size: 12px;
    font-weight: 600;
  }

  .status-success {
    color: #15803d;
  }

  .status-error {
    color: #b91c1c;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 6px;
    gap: 8px;
  }

  .info-label {
    color: #6b7280;
  }

  .info-value {
    font-weight: 600;
    color: #111827;
    text-align: right;
  }

  .secondary-btn {
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.14);
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 800;
    background: rgba(255, 255, 255, 0.92);
    color: #111827;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    box-shadow: var(--shadow-card);
  }

  .secondary-btn:hover {
    border-color: rgba(15, 61, 46, 0.28);
    background: rgba(15, 61, 46, 0.05);
  }

  .danger-btn {
    margin-top: 10px;
    border-radius: 999px;
    border: 1px solid rgba(185, 28, 28, 0.35);
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 800;
    background: rgba(185, 28, 28, 0.08);
    color: #991b1b;
    cursor: pointer;
  }

  .danger-btn:hover {
    background: rgba(185, 28, 28, 0.12);
  }

  .danger-btn:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .full-width {
    width: 100%;
  }

  .profile-bottom-safe {
    height: 72px;
  }

  @media (max-width: 720px) {
    .profile-inner {
      padding: 10px 12px 12px;
      gap: 14px;
    }

    .profile-header-card {
      flex-direction: column;
      align-items: flex-start;
    }

    .logout-btn {
      align-self: stretch;
      text-align: center;
    }

    .primary-btn {
      width: 100%;
      text-align: center;
      align-self: stretch;
    }

    .profile-bottom-safe {
      height: 80px;
    }
  }
`;