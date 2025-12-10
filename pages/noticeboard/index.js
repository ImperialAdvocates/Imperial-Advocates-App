// pages/noticeboard/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function NoticeboardPage() {
  const { isAdmin } = useProfile();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Load all posts
  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
          .from('noticeboard_posts')
          .select('*')
          .order('is_pinned', { ascending: false }) // pinned first
          .order('created_at', { ascending: false }); // newest first

        if (error) {
          console.error('Error loading noticeboard posts:', error);
          setLoadError(error.message || 'Unknown error');
          setPosts([]);
          return;
        }

        setPosts(data || []);
      } catch (err) {
        console.error('Unexpected noticeboard error:', err);
        setLoadError(err.message || 'Unexpected error');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const totalLabel =
    posts.length === 0
      ? 'No updates yet'
      : posts.length === 1
      ? '1 update'
      : `${posts.length} updates`;

  return (
    <div className="nb-screen">
      <div className="nb-phone">
        {/* HERO / HEADER – matches Courses / Dashboard vibe */}
        <header className="nb-hero">
          <div className="nb-hero-top-row">
            <div className="nb-hero-text">
              <p className="nb-hero-eyebrow">UPDATES</p>
              <h1 className="nb-hero-title">Noticeboard</h1>
              <p className="nb-hero-sub">
                Stay up to date with the latest announcements, training updates
                and important investor notices from the Imperial Advocates team.
              </p>
            </div>

            <div className="nb-hero-meta">
              <div className="nb-hero-pill">
                <span className="nb-hero-pill-dot" />
                <span>{totalLabel}</span>
              </div>

              {isAdmin && (
                <Link href="/admin/noticeboard" className="nb-hero-manage">
                  Manage posts →
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* LATEST UPDATES CARD */}
        <section className="nb-section">
          <div className="nb-section-header">
            <h2 className="nb-section-heading">Latest updates</h2>
          </div>

          {loading ? (
            <p className="nb-empty">Loading noticeboard…</p>
          ) : loadError ? (
            <p className="nb-empty">
              Could not load posts: {loadError}
            </p>
          ) : posts.length === 0 ? (
            <p className="nb-empty">
              No updates yet. Once the Imperial team shares a notice, it will
              appear here.
            </p>
          ) : (
            <div className="nb-updates-list">
              {posts.map((post) => {
                const hasInstagram = !!post.instagram_url;
                return (
                  <Link
                    key={post.id}
                    href={`/noticeboard/${post.id}`}
                    className="nb-update-card"
                  >
                    <div className="nb-update-main">
                      <div className="nb-update-title-row">
                        <div className="nb-update-icon">📢</div>
                        <div className="nb-update-text">
                          <p className="nb-update-title">{post.title}</p>
                          <p className="nb-update-date">
                            {formatDate(post.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="nb-update-pills">
                        {post.is_pinned && (
                          <span className="nb-pill nb-pill-pinned">
                            Pinned
                          </span>
                        )}
                        {hasInstagram && (
                          <span className="nb-pill nb-pill-ig">IG</span>
                        )}
                      </div>
                    </div>

                    <span className="nb-update-cta">
                      Open update →
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
  /* Outer wrapper – now matches dashboard shell */
  .nb-screen {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 12px 16px 24px; /* same as dash-inner */
  }

  .nb-phone {
    width: 100%;
    max-width: 520px;        /* match dashboard width */
    padding: 0;              /* cards handle their own padding */
    color: #0f172a;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* HERO */
  .nb-hero {
    border-radius: 20px;
    padding: 14px 14px 16px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
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

  /* SECTION CARD */
  .nb-section {
    border-radius: 22px;
    padding: 14px 14px 16px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 20px 55px rgba(15, 23, 42, 0.22);
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

  /* UPDATE CARDS */
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
    box-shadow:
      0 14px 36px rgba(15, 23, 42, 0.2),
      0 0 0 1px rgba(209, 213, 219, 0.7);
    text-decoration: none;
    color: #0f172a;
    transition: transform 0.08s ease-out, box-shadow 0.12s ease-out;
  }

  .nb-update-card:hover {
    transform: translateY(-1px);
    box-shadow:
      0 18px 50px rgba(15, 23, 42, 0.28),
      0 0 0 1px rgba(129, 140, 248, 0.9);
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
    background: radial-gradient(circle at top left, #fee2e2, #f97316);
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

  .nb-pill-ig {
    background: #fee2ff;
    color: #b91c1c;
    border: 1px solid #fb7185;
  }

  .nb-update-cta {
    font-size: 12px;
    font-weight: 500;
    color: #4f46e5;
    white-space: nowrap;
  }

  @media (max-width: 720px) {
    .nb-screen {
      padding: 10px 12px 80px; /* similar to dashboard mobile */
    }

    .nb-phone {
      padding: 0;
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

    .nb-update-cta {
      margin-top: 4px;
    }
  }
`}</style>
    </div>
  );
}