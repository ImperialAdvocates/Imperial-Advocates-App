// pages/admin/users.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useProfile } from '../../hooks/useProfile';

export default function AdminUsersPage() {
  const router = useRouter();
  const { loading, isAdmin } = useProfile();

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [found, setFound] = useState(null); // { id, email, username, full_name, role }
  const [status, setStatus] = useState('');

  // guard
  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/dashboard');
  }, [loading, isAdmin, router]);

  async function handleSearch(e) {
    e.preventDefault();
    setStatus('');
    setFound(null);

    const clean = email.trim().toLowerCase();
    if (!clean) {
      setStatus('Enter an email to search.');
      return;
    }

    try {
      setSearching(true);

      const resp = await fetch('/api/admin/user-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        setStatus(json?.error || 'Could not search user.');
        return;
      }

      setFound(json?.user || null);
      if (!json?.user) setStatus('No user found with that email.');
    } catch (err) {
      setStatus(err?.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  }

  async function setRole(role) {
    if (!found?.id) return;

    try {
      setSaving(true);
      setStatus('');

      const resp = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: found.id, role }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        setStatus(json?.error || 'Could not update role.');
        return;
      }

      setFound((prev) => ({ ...prev, role }));
      setStatus(`Role updated to "${role}".`);
    } catch (err) {
      setStatus(err?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-screen">
        <div className="admin-inner">
          <section className="admin-header-card">
            <p className="admin-eyebrow">ADMIN</p>
            <h1 className="admin-title">Checking permissions…</h1>
            <p className="admin-sub">Please wait a moment.</p>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-screen">
      <div className="admin-inner">
        <section className="admin-header-card">
          <p className="admin-eyebrow">ADMIN • USERS</p>
          <h1 className="admin-title">User roles</h1>
          <p className="admin-sub">
            Search a user by email and change their role from <strong>viewer</strong> to{' '}
            <strong>investor</strong>.
          </p>

          <Link href="/admin" className="admin-link">
            ← Back to admin home
          </Link>
        </section>

        <section className="admin-card">
          <h2 className="admin-card-title">Search by email</h2>

          <form onSubmit={handleSearch} className="form-row">
            <input
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. investor@email.com"
              autoComplete="email"
            />
            <button className="primary-btn" type="submit" disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          {status && <p className="status">{status}</p>}
        </section>

        {found && (
          <section className="admin-card">
            <h2 className="admin-card-title">Result</h2>

            <div className="result-card">
              <div className="result-main">
                <div className="result-line">
                  <span className="label">Email</span>
                  <span className="value">{found.email}</span>
                </div>
                <div className="result-line">
                  <span className="label">Name</span>
                  <span className="value">{found.full_name || '—'}</span>
                </div>
                <div className="result-line">
                  <span className="label">Username</span>
                  <span className="value">{found.username || '—'}</span>
                </div>
                <div className="result-line">
                  <span className="label">Current role</span>
                  <span className="value role">{found.role || 'viewer'}</span>
                </div>
              </div>

              <div className="actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setRole('viewer')}
                  disabled={saving}
                >
                  Set to Viewer
                </button>

                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setRole('investor')}
                  disabled={saving}
                >
                  Set to Investor
                </button>

                <button
                  type="button"
                  className="ghost-btn danger"
                  onClick={() => setRole('admin')}
                  disabled={saving}
                  title="Only do this for your team members"
                >
                  Set to Admin
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="admin-bottom-safe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .admin-screen {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 12px 16px 24px;
  }

  .admin-inner {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .admin-header-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: #ffffff;
    box-shadow: var(--shadow-brand);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .admin-eyebrow {
    margin: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #9ca3af;
  }

  .admin-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }

  .admin-sub {
    margin: 2px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  .admin-link {
    margin-top: 10px;
    font-size: 13px;
    color: #4f46e5;
    text-decoration: none;
    width: fit-content;
  }

  .admin-link:hover { text-decoration: underline; }

  .admin-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: #ffffff;
    box-shadow: var(--shadow-brand);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .admin-card-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .form-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .field-input {
    width: 100%;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.14);
    background: rgba(255, 255, 255, 0.92);
    color: #111827;
    padding: 10px 12px;
    font-size: 16px;
    outline: none;
  }

  .field-input:focus {
    border-color: rgba(15, 61, 46, 0.55);
    box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.12);
    background: #ffffff;
  }

  .primary-btn {
    border-radius: 999px;
    border: none;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 800;
    background: var(--ia-grad);
    color: #ffffff;
    box-shadow: var(--shadow-brand);
    cursor: pointer;
    white-space: nowrap;
  }

  .primary-btn:disabled { opacity: 0.7; cursor: default; box-shadow: none; }

  .status {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
  }

  .result-card {
    border-radius: 18px;
    background: linear-gradient(145deg, #ffffff, #eef2ff);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(209, 213, 219, 0.7);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .result-line {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 13px;
  }

  .label { color: #6b7280; }
  .value { color: #111827; font-weight: 600; text-align: right; }
  .value.role { text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .ghost-btn {
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.14);
    background: #ffffff;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .ghost-btn:disabled { opacity: 0.7; cursor: default; }

  .ghost-btn.danger {
    border-color: rgba(185, 28, 28, 0.35);
    color: #991b1b;
    background: rgba(185, 28, 28, 0.06);
  }

  .admin-bottom-safe { height: 60px; }

  @media (max-width: 720px) {
    .admin-screen { padding: 10px 12px 80px; }
    .form-row { flex-direction: column; align-items: stretch; }
    .primary-btn { width: 100%; }
    .admin-bottom-safe { height: 80px; }
  }
`;