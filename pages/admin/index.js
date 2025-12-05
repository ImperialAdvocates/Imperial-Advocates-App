// pages/admin/index.js
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useProfile } from '../../hooks/useProfile';

export default function AdminHome() {
  const router = useRouter();
  const { loading, isAdmin, profile } = useProfile();

  // If not admin, bounce them back to dashboard
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <p style={{ opacity: 0.8 }}>Checking permissions…</p>
    );
  }

  if (!isAdmin) {
    // Brief flash message if redirect didn’t happen for some reason
    return (
      <p style={{ opacity: 0.8 }}>You don’t have access to this page.</p>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <p className="admin-eyebrow">IMPERIAL CONTROL • ADMIN</p>
        <h1 className="admin-title">Admin control centre</h1>
        <p className="admin-subtitle">
          Welcome back, {profile?.username || 'admin'}.{' '}
          Manage training content, noticeboard posts and meetings from one place.
        </p>
      </header>

      <section className="admin-grid">
        {/* Noticeboard */}
        <Link href="/admin/noticeboard" className="admin-card">
          <div className="admin-pill">Noticeboard</div>
          <h2>Manage noticeboard posts</h2>
          <p>
            Create new updates, pin important announcements and remove old posts
            without logging into Supabase.
          </p>
          <span className="admin-cta">Open noticeboard manager →</span>
        </Link>

        {/* Courses */}
        <Link href="/admin/courses" className="admin-card">
          <div className="admin-pill">Courses</div>
          <h2>Manage courses &amp; lessons</h2>
          <p>
            Add new courses, update lesson content and control which modules
            investors see in their portal.
          </p>
          <span className="admin-cta">Open course manager →</span>
        </Link>

        {/* Meetings */}
        <Link href="/admin/meetings" className="admin-card">
          <div className="admin-pill">Meetings</div>
          <h2>Manage upcoming meetings</h2>
          <p>
            Create or update strategy calls, webinar sessions and live Q&amp;A
            events in your calendar.
          </p>
          <span className="admin-cta">Open meetings manager →</span>
        </Link>
      </section>

      <style jsx>{`
        .admin-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .admin-header {
          background: radial-gradient(
            circle at top left,
            #283b8f 0%,
            #050a40 55%,
            #02041f 100%
          );
          border-radius: 22px;
          padding: 20px 22px 22px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.9);
        }

        .admin-eyebrow {
          margin: 0 0 4px;
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          opacity: 0.82;
        }

        .admin-title {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 700;
        }

        .admin-subtitle {
          margin: 0;
          font-size: 13px;
          opacity: 0.9;
          max-width: 640px;
        }

        .admin-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .admin-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 18px 18px 16px;
          border-radius: 20px;
          text-decoration: none;
          color: #ffffff;
          background: radial-gradient(circle at top left, #f68a65 0%, #091654 60%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.85);
          transition: transform 0.08s ease-out, box-shadow 0.08s ease-out,
            background 0.12s ease-out;
        }

        .admin-card:nth-child(2) {
          background: radial-gradient(circle at top left, #6bb1ff 0%, #081342 60%);
        }

        .admin-card:nth-child(3) {
          background: radial-gradient(circle at top left, #f2ce63 0%, #081342 60%);
        }

        .admin-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95);
        }

        .admin-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.3);
          color: #fef7dd;
        }

        .admin-card h2 {
          margin: 4px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .admin-card p {
          margin: 0;
          font-size: 13px;
          opacity: 0.95;
        }

        .admin-cta {
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.9;
        }

        @media (max-width: 900px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}