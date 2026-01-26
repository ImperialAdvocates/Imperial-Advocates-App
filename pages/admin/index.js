// pages/admin/index.js
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useProfile } from '../../hooks/useProfile';

export default function AdminHome() {
  const router = useRouter();
  const { loading, isAdmin, profile } = useProfile();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, isAdmin, router]);

  const displayName =
    (profile?.full_name && profile.full_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'admin');

  if (loading) {
    return (
      <div className="admin-screen">
        <div className="admin-inner">
          <section className="admin-header admin-header--textured">
            <p className="admin-eyebrow">ADMIN</p>
            <h1 className="admin-title">Checking permissions…</h1>
            <p className="admin-sub">Please wait a moment.</p>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-screen">
      <div className="admin-inner">
        {/* HEADER */}
        <section className="admin-header admin-header--textured">
          <p className="admin-eyebrow">IMPERIAL CONTROL • ADMIN</p>
          <h1 className="admin-title">Admin control centre</h1>
          <p className="admin-sub">
            Welcome back, {displayName}. Manage portal content and user access.
          </p>
        </section>

        {/* TOOLS */}
        <section className="admin-card">
          <h2 className="admin-card-title">Admin tools</h2>

          <div className="admin-grid">
            <Link href="/admin/noticeboard" className="admin-tool">
              <div className="tool-icon tool-icon--gold">DOC</div>
              <div className="tool-body">
                <p className="tool-label">Documents</p>
                <h3 className="tool-title">Manage documents</h3>
                <p className="tool-sub">
                  Create updates, pin important items and remove old documents.
                </p>
                <span className="tool-cta">Open documents manager →</span>
              </div>
            </Link>

            <Link href="/admin/courses" className="admin-tool">
              <div className="tool-icon tool-icon--green">CRS</div>
              <div className="tool-body">
                <p className="tool-label">Courses</p>
                <h3 className="tool-title">Manage courses & lessons</h3>
                <p className="tool-sub">
                  Add new courses, update lessons, and control training content.
                </p>
                <span className="tool-cta">Open course manager →</span>
              </div>
            </Link>

            <Link href="/admin/users" className="admin-tool">
              <div className="tool-icon tool-icon--slate">USR</div>
              <div className="tool-body">
                <p className="tool-label">Users</p>
                <h3 className="tool-title">Manage user roles</h3>
                <p className="tool-sub">
                  Search by email and change accounts from Viewer to Investor.
                </p>
                <span className="tool-cta">Open user manager →</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Strategy */}
<Link href="/admin/strategy" className="admin-tool">
  <div className="admin-tool-icon admin-tool-icon--blue">STR</div>
  <div className="admin-tool-body">
    <p className="admin-tool-label">Strategy</p>
    <h3 className="admin-tool-title">Manage strategy modules & lessons</h3>
    <p className="admin-tool-sub">
      Create investor strategy preparation modules and upload lesson videos.
    </p>
    <span className="admin-tool-cta">Open strategy manager →</span>
  </div>
</Link>

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

  /* TEXTURED HEADER */
  .admin-header {
    border-radius: 22px;
    padding: 14px 16px 16px;
    color: #ffffff;
    box-shadow: var(--shadow-brand);
    position: relative;
    overflow: hidden;
  }

  .admin-header--textured {
    background-image: url('/bg/ia-texture.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border: 1px solid rgba(255, 255, 255, 0.14);
  }

  .admin-header--textured::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(11, 46, 35, 0.86),
      rgba(15, 61, 46, 0.70)
    );
    pointer-events: none;
  }

  .admin-header > * { position: relative; z-index: 1; }

  .admin-eyebrow {
    margin: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    opacity: 0.92;
  }

  .admin-title {
    margin: 0;
    font-size: 20px;
    font-weight: 900;
  }

  .admin-sub {
    margin: 2px 0 0;
    font-size: 13px;
    opacity: 0.92;
  }

  .admin-card {
    border-radius: 22px;
    padding: 14px 16px 16px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(15, 23, 42, 0.10);
    box-shadow: var(--shadow-brand);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .admin-card-title {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: #111827;
  }

  .admin-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .admin-tool {
    display: flex;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 16px;
    text-decoration: none;
    color: #0f172a;
    background: linear-gradient(145deg, #ffffff, #f3f4f6);
    box-shadow:
      0 14px 36px rgba(15, 23, 42, 0.14),
      0 0 0 1px rgba(209, 213, 219, 0.7);
    transition: transform 0.08s ease-out, box-shadow 0.12s ease-out;
  }

  .admin-tool:hover {
    transform: translateY(-1px);
    box-shadow:
      0 18px 50px rgba(15, 23, 42, 0.22),
      0 0 0 1px rgba(15, 61, 46, 0.22);
  }

  .tool-icon {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    color: #0b2e23;
    flex-shrink: 0;
  }

  .tool-icon--green { background: radial-gradient(circle at top left, #d1fae5, #34d399); }
  .tool-icon--gold  { background: radial-gradient(circle at top left, #fde68a, #f59e0b); }
  .tool-icon--slate { background: radial-gradient(circle at top left, #e5e7eb, #94a3b8); }

  .tool-body { display: flex; flex-direction: column; gap: 2px; }

  .tool-label {
    margin: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #9ca3af;
  }

  .tool-title {
    margin: 0;
    font-size: 14px;
    font-weight: 800;
    color: #111827;
  }

  .tool-sub {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }

  .tool-cta {
    margin-top: 4px;
    font-size: 12px;
    color: #4f46e5;
  }

  .admin-bottom-safe { height: 60px; }

  @media (max-width: 720px) {
    .admin-screen { padding: 10px 12px 80px; }
    .admin-bottom-safe { height: 80px; }
  }
`;