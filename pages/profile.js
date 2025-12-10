// pages/profile.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from '../hooks/useProfile';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading: profileLoading, isAdmin } = useProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // Populate form once profile is loaded
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || '');
    setLastName(profile.last_name || '');
    setUsername(profile.username || '');
  }, [profile]);

  async function handleSave(e) {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setStatus('');

      const payload = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        username: username.trim() || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id);

      if (error) {
        console.error('Error updating profile:', error);
        setStatus('Could not save changes. Please try again.');
      } else {
        setStatus('Profile updated successfully.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (profileLoading && !profile) {
    return (
      <div className="profile-screen">
        <div className="profile-inner">
          <section className="profile-header-card">
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
          <section className="profile-header-card">
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

  const displayInitials = (() => {
    const f = (firstName || '').trim();
    const l = (lastName || '').trim();
    if (f || l) {
      return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || 'IA';
    }
    if (profile.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'IA';
  })();

  const displayName =
    (firstName && firstName.trim()) ||
    (profile.username && profile.username.trim()) ||
    (profile.email ? profile.email.split('@')[0] : 'Investor');

  const isSuccess = status && status.toLowerCase().includes('success');

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

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </section>

        {/* GRID: DETAILS + ACCOUNT INFO */}
        <div className="profile-grid">
          {/* LEFT: EDITABLE FIELDS */}
          <section className="profile-card">
            <h2 className="card-title">Personal details</h2>
            <p className="card-sub">
              Update how your name appears across the Imperial Advocates portal.
            </p>

            <form onSubmit={handleSave} className="profile-form">
              <div className="form-row">
                <label className="field">
                  <span className="field-label">First name</span>
                  <input
                    type="text"
                    className="field-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Akshat"
                  />
                </label>

                <label className="field">
                  <span className="field-label">Last name</span>
                  <input
                    type="text"
                    className="field-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sharma"
                  />
                </label>
              </div>

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

              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>

              {status && (
                <p className={`status-text ${isSuccess ? 'status-success' : 'status-error'}`}>
                  {status}
                </p>
              )}
            </form>
          </section>

          {/* RIGHT: ACCOUNT INFO */}
          <section className="profile-card">
            <h2 className="card-title">Account</h2>
            <p className="card-sub">Your login and membership information.</p>

            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{profile.email}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-value">
                {isAdmin ? 'Admin / Team' : 'Investor'}
              </span>
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
          </section>
        </div>

        <div className="profile-bottom-safe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  /* Match dashboard shell sizing */
  .profile-screen {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .profile-inner {
    width: 100%;
    max-width: 520px; /* same as dash-inner */
    padding: 12px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* HEADER CARD – use same gradient family as dashboard CTAs */
  .profile-header-card {
    border-radius: 22px;
    padding: 14px 18px;
    background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
    box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
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
    background: rgba(15, 23, 42, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.7);
  }

  .profile-avatar.skeleton {
    background: rgba(15, 23, 42, 0.4);
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
  }

  .role-pill {
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: rgba(15, 23, 42, 0.4);
  }

  .profile-email {
    font-size: 13px;
    opacity: 0.92;
  }

  .logout-btn {
    border-radius: 999px;
    border: none;
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 600;
    background: #111827;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.7);
    white-space: nowrap;
  }

  .logout-btn:hover {
    opacity: 0.95;
  }

  /* GRID OF CARDS (stacked on mobile, but still 2 columns on wider screens) */
  .profile-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .profile-card {
    border-radius: 22px;
    padding: 14px 16px 16px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
  }

  .card-title {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .card-sub {
    margin: 0 0 12px;
    font-size: 13px;
    color: #6b7280;
  }

  /* FORM */
  .profile-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .form-row {
    display: flex;
    gap: 10px;
  }

  .field {
    flex: 1;
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
    border: 1px solid #d1d5db;
    background: #f9fafb;
    color: #111827;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
  }

  .field-input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.12);
    background: #ffffff;
  }

  .field-help {
    font-size: 11px;
    color: #6b7280;
  }

  .primary-btn {
    border-radius: 999px;
    border: none;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 600;
    background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
    color: #ffffff;
    cursor: pointer;
    margin-top: 4px;
    box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
    align-self: flex-start;
  }

  .primary-btn[disabled] {
    opacity: 0.85;
    cursor: default;
    box-shadow: none;
  }

  .status-text {
    margin: 6px 0 0;
    font-size: 12px;
  }

  .status-success {
    color: #15803d;
  }

  .status-error {
    color: #b91c1c;
  }

  /* INFO PANEL */
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
    font-weight: 500;
    color: #111827;
    text-align: right;
  }

  .secondary-btn {
    border-radius: 999px;
    border: 1px solid #d1d5db;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 600;
    background: #f9fafb;
    color: #111827;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
  }

  .secondary-btn:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .full-width {
    width: 100%;
  }

  .profile-bottom-safe {
    height: 72px; /* same vibe as dash-bottom-safe */
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

    .form-row {
      flex-direction: column;
    }

    .profile-bottom-safe {
      height: 80px;
    }
  }
`;