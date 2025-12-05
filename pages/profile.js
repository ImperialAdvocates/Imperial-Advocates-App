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
    router.push('/login');
  }

  if (profileLoading && !profile) {
    return (
      <div className="profile-root">
        <p>Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-root">
        <p>Could not load profile.</p>
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

  return (
    <div className="profile-root">
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
            Update how your name appears across the Imperial Advocates
            portal.
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

            {status && <p className="status-text">{status}</p>}
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

      <style jsx>{`
        .profile-root {
          max-width: 1040px;
          margin: 0 auto;
          padding: 18px 16px 80px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .profile-header-card {
          border-radius: 22px;
          padding: 18px 20px;
          background: linear-gradient(90deg, #f4a261, #e76f51, #1b1f6b);
          box-shadow: 0 22px 55px rgba(0, 0, 0, 0.9);
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
          width: 60px;
          height: 60px;
          border-radius: 999px;
          background: rgba(2, 3, 24, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.9);
        }

        .profile-header-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .profile-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .profile-name {
          margin: 0;
          font-size: 22px;
        }

        .role-pill {
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .profile-email {
          font-size: 13px;
          opacity: 0.9;
        }

        .logout-btn {
          border-radius: 999px;
          border: none;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 600;
          background: #020316;
          color: #ffffff;
          cursor: pointer;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.85);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 18px;
        }

        .profile-card {
          border-radius: 20px;
          padding: 16px 20px 18px;
          background: rgba(3, 6, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
        }

        .card-title {
          margin: 0 0 4px;
          font-size: 18px;
        }

        .card-sub {
          margin: 0 0 12px;
          font-size: 13px;
          opacity: 0.9;
        }

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
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          opacity: 0.8;
        }

        .field-input {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(2, 3, 24, 0.9);
          color: #ffffff;
          padding: 8px 10px;
          font-size: 13px;
          outline: none;
        }

        .field-input:focus {
          border-color: rgba(255, 255, 255, 0.4);
        }

        .field-help {
          font-size: 11px;
          opacity: 0.75;
        }

        .primary-btn {
          border-radius: 999px;
          border: none;
          padding: 9px 18px;
          font-size: 14px;
          font-weight: 600;
          background: linear-gradient(90deg, #ff8b5f, #0a147c);
          color: #ffffff;
          cursor: pointer;
          margin-top: 4px;
        }

        .secondary-btn {
          border-radius: 999px;
          border: none;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .full-width {
          width: 100%;
          margin-top: 10px;
        }

        .status-text {
          margin: 4px 0 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .info-label {
          opacity: 0.8;
        }

        .info-value {
          font-weight: 500;
        }

        @media (max-width: 840px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .profile-root {
            padding-bottom: 100px;
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
        }
      `}</style>
    </div>
  );
}