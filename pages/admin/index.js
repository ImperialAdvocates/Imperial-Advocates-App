// pages/admin/index.js
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useProfile } from '../../hooks/useProfile';

export default function AdminHome() {
  const router = useRouter();
  const { loading, isAdmin, profile } = useProfile();

  // Redirect non-admins back to dashboard
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, isAdmin, router]);

  const displayName =
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'admin');

  // While we’re checking permissions, still keep the shell so it looks consistent
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

  // Fallback if redirect didn’t happen
  if (!isAdmin) {
    return (
      <div className="admin-screen">
        <div className="admin-inner">
          <section className="admin-header-card">
            <p className="admin-eyebrow">ADMIN</p>
            <h1 className="admin-title">No access</h1>
            <p className="admin-sub">
              You don&apos;t have access to this page.
            </p>
            <Link href="/dashboard" className="admin-link">
              ← Back to dashboard
            </Link>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="admin-screen">
      <div className="admin-inner">
        {/* HEADER – matches light card style */}
        <section className="admin-header-card">
          <p className="admin-eyebrow">IMPERIAL CONTROL • ADMIN</p>
          <h1 className="admin-title">Admin control centre</h1>
          <p className="admin-sub">
            Welcome back, {displayName}. Manage training content and
            noticeboard posts from one place.
          </p>
        </section>

        {/* GRID OF ACTION CARDS */}
        <section className="admin-grid-card">
          <h2 className="admin-grid-heading">Admin tools</h2>

          <div className="admin-grid">
            {/* Noticeboard */}
            <Link href="/admin/noticeboard" className="admin-tool">
              <div className="admin-tool-icon admin-tool-icon--orange">NB</div>
              <div className="admin-tool-body">
                <p className="admin-tool-label">Noticeboard</p>
                <h3 className="admin-tool-title">
                  Manage noticeboard posts
                </h3>
                <p className="admin-tool-sub">
                  Create new updates, pin important announcements and remove old
                  posts without logging into Supabase.
                </p>
                <span className="admin-tool-cta">
                  Open noticeboard manager →
                </span>
              </div>
            </Link>

            {/* Courses */}
            <Link href="/admin/courses" className="admin-tool">
              <div className="admin-tool-icon admin-tool-icon--blue">CRS</div>
              <div className="admin-tool-body">
                <p className="admin-tool-label">Courses</p>
                <h3 className="admin-tool-title">
                  Manage courses &amp; lessons
                </h3>
                <p className="admin-tool-sub">
                  Add new courses, update lesson content and control which
                  modules investors see in their portal.
                </p>
                <span className="admin-tool-cta">
                  Open course manager →
                </span>
              </div>
            </Link>
          </div>
        </section>

        <div className="admin-bottom-safe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  /* Match dashboard shell */
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

  /* HEADER CARD */
  .admin-header-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: #ffffff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
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
    max-width: 640px;
  }

  .admin-link {
    margin-top: 10px;
    font-size: 13px;
    color: #4f46e5;
    text-decoration: none;
  }

  .admin-link:hover {
    text-decoration: underline;
  }

  /* GRID CARD */
  .admin-grid-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: #ffffff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .admin-grid-heading {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .admin-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .admin-tool {
    display: flex;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 16px;
    text-decoration: none;
    color: #0f172a;
    background: linear-gradient(145deg, #ffffff, #eef2ff);
    box-shadow:
      0 14px 36px rgba(15, 23, 42, 0.16),
      0 0 0 1px rgba(209, 213, 219, 0.7);
    transition: transform 0.08s ease-out, box-shadow 0.12s ease-out;
  }

  .admin-tool:hover {
    transform: translateY(-1px);
    box-shadow:
      0 18px 50px rgba(15, 23, 42, 0.24),
      0 0 0 1px rgba(129, 140, 248, 0.9);
  }

  .admin-tool-icon {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #111827;
    flex-shrink: 0;
  }

  .admin-tool-icon--orange {
    background: radial-gradient(circle at top left, #fed7aa, #f97316);
  }

  .admin-tool-icon--blue {
    background: radial-gradient(circle at top left, #bfdbfe, #3b82f6);
  }

  .admin-tool-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .admin-tool-label {
    margin: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #9ca3af;
  }

  .admin-tool-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .admin-tool-sub {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }

  .admin-tool-cta {
    margin-top: 4px;
    font-size: 12px;
    color: #4f46e5;
  }

  .admin-bottom-safe {
    height: 60px;
  }

  @media (max-width: 720px) {
    .admin-screen {
      padding: 10px 12px 80px;
    }

    .admin-grid-card {
      padding: 12px 12px 14px;
    }

    .admin-tool {
      align-items: flex-start;
    }

    .admin-bottom-safe {
      height: 80px;
    }
  }
`;