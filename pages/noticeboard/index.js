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
    return new Date(d).toLocaleDateString();
  }

  return (
      <div className="nb-root">
        {/* HERO / HEADER */}
        <section className="nb-hero">
          <div className="nb-hero-top">
            <div>
              <div className="nb-kicker">IMPERIAL UPDATES</div>
              <h1 className="nb-title">Noticeboard</h1>
              <p className="nb-subtitle">
                Stay up to date with the latest announcements, training updates
                and important investor notices from the Imperial Advocates team.
              </p>
            </div>

            {isAdmin && (
              <div className="nb-admin-cta">
                <Link href="/admin/noticeboard" className="nb-admin-link">
                  Manage posts →
                </Link>
              </div>
            )}
          </div>

          <div className="nb-hero-meta">
            <div className="nb-hero-pill">
              {loading
                ? 'Loading posts…'
                : posts.length === 0
                ? 'No posts yet'
                : `${posts.length} POST${posts.length === 1 ? '' : 'S'} TOTAL`}
            </div>
          </div>
        </section>

        {/* LIST OF POSTS */}
        <section className="nb-list-section">
          {loading ? (
            <div className="nb-empty">Loading noticeboard…</div>
          ) : posts.length === 0 ? (
            <div className="nb-empty">
              {loadError
                ? `Could not load posts: ${loadError}`
                : 'No posts yet. Once the Imperial team shares an update, it will appear here.'}
            </div>
          ) : (
            <div className="nb-list">
              {posts.map((post) => {
                const snippet =
                  post.body && post.body.length > 160
                    ? post.body.slice(0, 160) + '…'
                    : post.body || '';

                const hasInstagram = !!post.instagram_url;

                return (
                  <Link
                    key={post.id}
                    href={`/noticeboard/${post.id}`}
                    className={
                      post.is_pinned ? 'nb-card nb-card-pinned' : 'nb-card'
                    }
                  >
                    {/* MAIN TEXT BLOCK */}
                    <div className="nb-card-main">
                      {/* Title + date */}
                      <div className="nb-card-top-row">
                        <h2 className="nb-card-title">{post.title}</h2>
                        <div className="nb-card-date">
                          {formatDate(post.created_at)}
                        </div>
                      </div>

                      {/* Snippet */}
                      {snippet && (
                        <p className="nb-card-snippet">{snippet}</p>
                      )}

                      {/* Badges + CTA */}
                      <div className="nb-card-bottom-row">
                        <div className="nb-card-badges">
                          {post.is_pinned && (
                            <span className="nb-pill nb-pill-pinned">
                              Pinned
                            </span>
                          )}
                          {hasInstagram && (
                            <span className="nb-pill nb-pill-ig">
                              Instagram update
                            </span>
                          )}
                        </div>
                        <span className="nb-card-cta">
                          View full update →
                        </span>
                      </div>
                    </div>

                    {/* IG PREVIEW BLOCK (optional) */}
                    {hasInstagram && (
                      <div className="nb-card-media">
                        <div className="nb-thumb-placeholder">
                          <div className="nb-thumb-ig-icon">IG</div>
                          <div className="nb-thumb-text">
                            Opens Instagram post
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {loadError && (
          <p
            style={{
              marginTop: 8,
              fontSize: 11,
              opacity: 0.7,
            }}
          >
            Debug (noticeboard): {loadError}
          </p>
        )}

        <style jsx>{`
          .nb-root {
            max-width: 1040px;
            margin: 0 auto;
            padding: 16px 16px 80px;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          /* HERO */
          .nb-hero {
  border-radius: 22px;
  padding: 18px 20px 16px;

  /* IA Master Gradient */
  background: linear-gradient(90deg, #f4a261, #e76f51, #1b1f6b);

  box-shadow: 0 22px 55px rgba(0,0,0,0.9);
  color: #fff;

  /* Fixes the vertical bar on the right */
  overflow: hidden;
}

          .nb-hero-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }

          .nb-kicker {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            opacity: 0.9;
          }

          .nb-title {
            margin: 4px 0 4px;
            font-size: 24px;
            font-weight: 700;
          }

          .nb-subtitle {
            margin: 0;
            font-size: 13px;
            max-width: 520px;
            opacity: 0.95;
          }

          .nb-admin-cta {
            flex-shrink: 0;
          }

          .nb-admin-link {
            font-size: 12px;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.78);
            text-decoration: none;
            color: #fff;
            background: rgba(2, 3, 34, 0.18);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            transition: background 0.12s ease-out, transform 0.08s ease-out,
              box-shadow 0.12s ease-out;
          }

          .nb-admin-link:hover {
            background: rgba(2, 3, 34, 0.5);
            transform: translateY(-1px);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 1);
          }

          .nb-hero-meta {
            margin-top: 10px;
          }

          .nb-hero-pill {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 11px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            background: rgba(0, 0, 0, 0.28);
            color: #fef7dd;
          }

          /* LIST SECTION */
          .nb-list-section {
            border-radius: 20px;
            padding: 14px 18px 16px;
            background: rgba(3, 6, 40, 0.97);
            box-shadow: 0 20px 52px rgba(0, 0, 0, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.14);
          }

          .nb-empty {
            font-size: 13px;
            opacity: 0.85;
          }

          .nb-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          /* POST CARD */
          .nb-card {
            display: flex;
            align-items: stretch;
            justify-content: space-between;
            gap: 14px;
            text-decoration: none;
            color: #ffffff;
            border-radius: 16px;
            padding: 12px 14px;
            background: radial-gradient(
              circle at top left,
              #182472 0%,
              #050a3a 70%
            );
            border: 1px solid rgba(255, 255, 255, 0.14);
            box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85);
            transition: transform 0.08s ease-out, box-shadow 0.08s ease-out,
              border-color 0.12s ease-out, background 0.12s ease-out;
          }

          .nb-card-pinned {
            background: radial-gradient(
              circle at top left,
              #f8b45a 0%,
              #182472 40%,
              #050a3a 80%
            );
            border-color: rgba(248, 180, 90, 0.7);
          }

          .nb-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 22px 56px rgba(0, 0, 0, 0.95);
            border-color: rgba(255, 255, 255, 0.25);
          }

          .nb-card-main {
            flex: 1.6;
            min-width: 0;
          }

          .nb-card-top-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 10px;
            margin-bottom: 4px;
          }

          .nb-card-title {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
          }

          .nb-card-date {
            font-size: 11px;
            opacity: 0.75;
            white-space: nowrap;
          }

          .nb-card-snippet {
            margin: 2px 0 8px;
            font-size: 12px;
            opacity: 0.9;
          }

          .nb-card-bottom-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
          }

          .nb-card-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
          }

          .nb-pill {
            display: inline-flex;
            align-items: center;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 10px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .nb-pill-pinned {
            background: rgba(246, 231, 184, 0.15);
            color: #f6e7b8;
            border: 1px solid rgba(246, 231, 184, 0.7);
          }

          .nb-pill-ig {
            background: rgba(255, 128, 192, 0.18);
            color: #ffd0f0;
            border: 1px solid rgba(255, 180, 220, 0.7);
          }

          .nb-card-cta {
            font-size: 12px;
            color: #f6e7b8;
            text-decoration: underline;
            text-decoration-style: dotted;
            white-space: nowrap;
          }

          /* MEDIA / INSTAGRAM PREVIEW */
          .nb-card-media {
            flex: 0.8;
            min-width: 130px;
            max-width: 170px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .nb-thumb-placeholder {
            width: 100%;
            border-radius: 12px;
            padding: 10px 8px;
            background: radial-gradient(
              circle at top left,
              #ff8bd1 0%,
              #c13584 40%,
              #4c1f63 80%
            );
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }

          .nb-thumb-ig-icon {
            width: 26px;
            height: 26px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
          }

          .nb-thumb-text {
            font-size: 11px;
            text-align: center;
            color: #fff;
            opacity: 0.95;
          }

          @media (max-width: 720px) {
            .nb-root {
              padding-bottom: 100px;
            }

            .nb-hero {
              padding: 14px 14px 12px;
            }

            .nb-hero-top {
              flex-direction: column;
              align-items: flex-start;
            }

            .nb-list-section {
              padding: 12px 12px 14px;
            }

            .nb-card {
              flex-direction: column;
            }

            .nb-card-media {
              max-width: 100%;
              width: 100%;
            }

            .nb-card-bottom-row {
              flex-direction: column;
              align-items: flex-start;
            }

            .nb-card-cta {
              margin-top: 4px;
            }
          }
        `}</style>
      </div>
  );
}