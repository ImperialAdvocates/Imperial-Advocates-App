// pages/noticeboard/index.js
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function NoticeboardPage() {
  const { profile, loading: profileLoading, isAdmin } = useProfile();

  const role = profile?.role || 'viewer';

  // ✅ Locked for anyone who is NOT investor/admin
  const isLocked = useMemo(() => !['investor', 'admin'].includes(role), [role]);

  const BOOK_CALL_URL =
    'https://api.leadconnectorhq.com/widget/booking/gBhfSeUYYjXTgOIPNVYt';

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Load posts ONLY if unlocked
  useEffect(() => {
    if (profileLoading) return;
    if (isLocked) return;

    let cancelled = false;

    async function loadPosts() {
      try {
        setLoadingPosts(true);
        setLoadError(null);

        const { data, error } = await supabase
          .from('noticeboard_posts')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (error) {
          console.error('Error loading documents:', error);
          setLoadError(error.message || 'Unknown error');
          setPosts([]);
          return;
        }

        setPosts(data || []);
      } catch (err) {
        if (cancelled) return;
        console.error('Unexpected documents error:', err);
        setLoadError(err.message || 'Unexpected error');
        setPosts([]);
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, isLocked]);

  function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  // ----------------------------
  // 1) Loading state
  // ----------------------------
  if (profileLoading) {
    return (
      <div style={{ padding: 16, color: '#6b7280' }}>
        Loading…
      </div>
    );
  }

  // ----------------------------
  // 2) Locked state (viewer)
  // ----------------------------
  if (isLocked) {
    return (
      <div className="locked-page">
        <div className="locked-card">
          <p className="locked-eyebrow">DOCUMENTS</p>
          <h1 className="locked-title">Documents locked</h1>
          <p className="locked-sub">
            To unlock access to our investor documents and resources, please book an
            information session with a consultant.
          </p>

          <a
            href={BOOK_CALL_URL}
            target="_blank"
            rel="noreferrer"
            className="locked-btn"
          >
            Book an information session →
          </a>

          <p className="locked-footnote">
            Once your account is upgraded, this page will unlock automatically.
          </p>
        </div>

        <style jsx>{`
          .locked-page {
            width: 100%;
            display: flex;
            justify-content: center;
            padding: 12px 16px 24px;
          }

          .locked-card {
            width: 100%;
            max-width: 520px;
            background: #ffffff;
            border-radius: 22px;
            padding: 18px 18px 20px;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
            text-align: center;
          }

          .locked-eyebrow {
            margin: 0 0 6px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #a1a6c0;
          }

          .locked-title {
            margin: 0 0 8px;
            font-size: 20px;
            font-weight: 700;
            color: #111827;
          }

          .locked-sub {
            margin: 0 auto;
            font-size: 13px;
            line-height: 1.5;
            color: #6b7280;
            max-width: 420px;
          }

          .locked-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 14px;
            padding: 11px 16px;
            border-radius: 999px;
            background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
            white-space: nowrap;
          }

          .locked-footnote {
            margin: 12px 0 0;
            font-size: 12px;
            color: #9ca3af;
          }
        `}</style>
      </div>
    );
  }

  // ----------------------------
  // 3) Unlocked state (investor/admin)
  // ----------------------------
  const totalLabel =
    posts.length === 0
      ? 'No documents yet'
      : posts.length === 1
      ? '1 document'
      : `${posts.length} documents`;

  return (
    <div className="nb-screen">
      <div className="nb-phone">
        {/* HERO */}
        <header className="nb-hero">
          <div className="nb-hero-top-row">
            <div className="nb-hero-text">
              <p className="nb-hero-eyebrow">DOCUMENTS</p>
              <h1 className="nb-hero-title">Documents</h1>
              <p className="nb-hero-sub">
                Access important documents, updates, and resources provided by the
                Imperial Advocates team.
              </p>
            </div>

            <div className="nb-hero-meta">
              <div className="nb-hero-pill">
                <span className="nb-hero-pill-dot" />
                <span>{totalLabel}</span>
              </div>

              {isAdmin && (
                <Link href="/admin/noticeboard" className="nb-hero-manage">
                  Manage documents →
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* LIST */}
        <section className="nb-section">
          <div className="nb-section-header">
            <h2 className="nb-section-heading">Latest documents</h2>
          </div>

          {loadingPosts ? (
            <p className="nb-empty">Loading documents…</p>
          ) : loadError ? (
            <p className="nb-empty">Could not load documents: {loadError}</p>
          ) : posts.length === 0 ? (
            <p className="nb-empty">No documents have been added yet.</p>
          ) : (
            <div className="nb-updates-list">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/noticeboard/${post.id}`}
                  className="nb-update-card"
                >
                  <div className="nb-update-main">
                    <div className="nb-update-title-row">
                      <div className="nb-update-icon">📄</div>
                      <div className="nb-update-text">
                        <p className="nb-update-title">{post.title || 'Document'}</p>
                        <p className="nb-update-date">{formatDate(post.created_at)}</p>
                      </div>
                    </div>

                    <div className="nb-update-pills">
                      {post.is_pinned && (
                        <span className="nb-pill nb-pill-pinned">Pinned</span>
                      )}
                    </div>
                  </div>

                  <span className="nb-update-cta">Open →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .nb-screen {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 12px 16px 24px;
        }

        .nb-phone {
          width: 100%;
          max-width: 520px;
          padding: 0;
          color: #0f172a;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .nb-hero {
          border-radius: 20px;
          padding: 14px 14px 16px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
        }

        .nb-hero-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .nb-hero-text {
          max-width: 560px;
        }

        .nb-hero-eyebrow {
          margin: 0 0 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #9ca3af;
        }

        .nb-hero-title {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
        }

        .nb-hero-sub {
          margin: 0;
          font-size: 13px;
          line-height: 1.45;
          color: #4b5563;
        }

        .nb-hero-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .nb-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4b5563;
          font-size: 11px;
          font-weight: 500;
        }

        .nb-hero-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #4f46e5;
        }

        .nb-hero-manage {
          font-size: 12px;
          color: #111827;
          text-decoration: none;
        }

        .nb-hero-manage:hover {
          text-decoration: underline;
        }

        .nb-section {
          border-radius: 22px;
          padding: 14px 14px 16px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .nb-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .nb-section-heading {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .nb-empty {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .nb-updates-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nb-update-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-radius: 18px;
          padding: 10px 12px;
          background: linear-gradient(145deg, #ffffff, #eef2ff);
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
          text-decoration: none;
          color: #0f172a;
        }

        .nb-update-main {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .nb-update-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nb-update-icon {
          width: 34px;
          height: 34px;
          border-radius: 14px;
          background: radial-gradient(circle at top left, #dbeafe, #60a5fa);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .nb-update-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nb-update-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .nb-update-date {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        .nb-update-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .nb-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .nb-pill-pinned {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fbbf24;
        }

        .nb-update-cta {
          font-size: 12px;
          font-weight: 500;
          color: #4f46e5;
          white-space: nowrap;
        }

        @media (max-width: 720px) {
          .nb-screen {
            padding: 10px 12px 80px;
          }

          .nb-hero-top-row {
            flex-direction: column;
          }

          .nb-hero-meta {
            align-items: flex-start;
          }

          .nb-update-card {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}