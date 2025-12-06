// pages/noticeboard/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../layout';
import { supabase } from '../../lib/supabaseClient';

export default function NoticeboardPostPage() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadPost() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('noticeboard_posts')
          .select(
            `
            id,
            title,
            body,
            created_at,
            is_pinned,
            social_platform,
            social_url,
            ig_thumbnail_url
          `
          )
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error loading noticeboard post:', error);
          alert('Could not load noticeboard post. Check console.');
          router.push('/noticeboard');
          return;
        }

        setPost(data);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [id, router]);

  function formatFullDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-AU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <Layout>
        <div className="post-root">
          <p>Loading post…</p>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="post-root">
          <p>Post not found.</p>
        </div>
      </Layout>
    );
  }

  const hasBody = post.body && post.body.trim().length > 0;
  const socialUrl = post.social_url || null;
  const socialPlatform =
    (post.social_platform || '').toLowerCase() || null;
  const thumbUrl = post.ig_thumbnail_url || null;

  return (
    <Layout>
      <div className="post-root">
        {/* Back link */}
        <button
          type="button"
          className="back-link"
          onClick={() => router.push('/noticeboard')}
        >
          ← Back to noticeboard
        </button>

        {/* Header card */}
        <section className="post-header-card">
          <div className="post-header-top">
            <div className="post-header-meta">
              <div className="post-date">
                {formatFullDate(post.created_at)}
              </div>
            </div>

            {post.is_pinned && (
              <span className="post-pill post-pill-pinned">
                PINNED
              </span>
            )}
          </div>

          <h1 className="post-title">
            {post.title || 'Noticeboard update'}
          </h1>
        </section>

        {/* Body */}
        {hasBody && (
          <section className="post-body-card">
            <div className="post-body-text">
              {post.body.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>
        )}

        {/* Social post preview card */}
        {socialUrl && (
          <section className="post-social-card">
            <div className="post-social-inner">
              {/* LEFT: thumbnail (if provided) */}
              {thumbUrl && (
                <div
                  className="post-social-thumb"
                  style={{ backgroundImage: `url(${thumbUrl})` }}
                />
              )}

              {/* RIGHT: text + button */}
              <div className="post-social-content">
                <div className="post-social-header">
                  <span className="post-pill post-pill-platform">
                    {(socialPlatform || 'instagram').toUpperCase()}
                  </span>
                  <span className="post-social-sub">
                    Linked social update
                  </span>
                </div>

                <div className="post-social-main">
                  <p>
                    This noticeboard update includes a social post. Tap
                    the button below to open it in a new tab.
                  </p>

                  <a
                    href={socialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="post-social-button"
                  >
                    Open {socialPlatform || 'instagram'} post →
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        <style jsx>{`
          .post-root {
            max-width: 1040px;
            margin:-90px 0 auto;
            padding: 16px 16px 80px;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .back-link {
            align-self: flex-start;
            border: none;
            background: none;
            color: #f6e7b8;
            font-size: 13px;
            cursor: pointer;
            padding: 4px 0;
          }

          .post-header-card {
            border-radius: 22px;
            padding: 18px 20px;
            background: linear-gradient(
              90deg,
              #f4a261,
              #e76f51,
              #1b1f6b
            );
            box-shadow: 0 22px 55px rgba(0, 0, 0, 0.9);
            color: #ffffff;
          }

          .post-header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }

          .post-date {
            font-size: 12px;
            opacity: 0.9;
          }

          .post-pill {
            padding: 2px 10px;
            border-radius: 999px;
            font-size: 10px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            border: 1px solid rgba(255, 255, 255, 0.6);
          }

          .post-pill-pinned {
            background: rgba(0, 0, 0, 0.25);
          }

          .post-title {
            margin: 4px 0 0;
            font-size: 24px;
            font-weight: 700;
          }

          .post-body-card {
            border-radius: 20px;
            padding: 16px 20px;
            background: rgba(3, 6, 40, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.16);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
          }

          .post-body-text p {
            margin: 0 0 8px;
            font-size: 14px;
            line-height: 1.6;
          }

          .post-social-card {
            border-radius: 20px;
            padding: 16px 18px;
            background: radial-gradient(
              circle at top left,
              #e84a5f 0%,
              #b95dff 40%,
              #020316 100%
            );
            box-shadow: 0 22px 55px rgba(0, 0, 0, 0.9);
          }

          .post-social-inner {
            display: flex;
            gap: 14px;
            align-items: stretch;
            color: #fff;
          }

          .post-social-thumb {
            width: 140px;
            border-radius: 16px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            flex-shrink: 0;
          }

          .post-social-content {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .post-social-header {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .post-pill-platform {
            padding: 2px 10px;
            border-radius: 999px;
            font-size: 10px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            background: rgba(0, 0, 0, 0.3);
          }

          .post-social-sub {
            font-size: 12px;
            opacity: 0.9;
          }

          .post-social-main p {
            margin: 0 0 10px;
            font-size: 13px;
          }

          .post-social-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 16px;
            border-radius: 999px;
            background: rgba(2, 3, 24, 0.96);
            color: #fef7dd;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.85);
          }

          @media (max-width: 720px) {
            .post-root {
              padding-bottom: 100px;
            }

            .post-header-card,
            .post-body-card,
            .post-social-card {
              padding: 14px 14px 16px;
            }

            .post-title {
              font-size: 20px;
            }

            .post-social-inner {
              flex-direction: column;
            }

            .post-social-thumb {
              width: 100%;
              height: 180px;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}