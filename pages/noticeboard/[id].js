// pages/noticeboard/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function NoticeboardPostPage() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load single post
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
      <div className="post-page">
        <div className="post-inner">
          <p className="post-loading">Loading update…</p>

          <style jsx>{`
            .post-page {
              display: flex;
              justify-content: center;
            }
            .post-inner {
              width: 100%;
              max-width: 520px;
              padding: 12px 16px 24px;
            }
            .post-loading {
              margin: 0;
              font-size: 13px;
              color: #6b7280;
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-page">
        <div className="post-inner">
          <p className="post-loading">Update not found.</p>

          <style jsx>{`
            .post-page {
              display: flex;
              justify-content: center;
            }
            .post-inner {
              width: 100%;
              max-width: 520px;
              padding: 12px 16px 24px;
            }
            .post-loading {
              margin: 0;
              font-size: 13px;
              color: #6b7280;
            }
          `}</style>
        </div>
      </div>
    );
  }

  const hasBody = post.body && post.body.trim().length > 0;
  const socialUrl = post.social_url || null;
  const socialPlatform =
    (post.social_platform || '').toLowerCase() || null;

  return (
    <div className="post-page">
      <div className="post-inner">
        {/* Back link */}
        <button
          type="button"
          className="post-back"
          onClick={() => router.push('/noticeboard')}
        >
          ← Back to noticeboard
        </button>

        {/* HEADER CARD */}
        <section className="post-header-card">
          <div className="post-header-top">
            <div className="post-date">
              {formatFullDate(post.created_at)}
            </div>

            {post.is_pinned && (
              <span className="post-pill post-pill-pinned">Pinned</span>
            )}
          </div>

          <h1 className="post-title">
            {post.title || 'Noticeboard update'}
          </h1>
        </section>

        {/* BODY CARD (optional) */}
        {hasBody && (
          <section className="post-body-card">
            <div className="post-body-text">
              {post.body.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>
        )}

        {/* SOCIAL CARD (optional) */}
        {socialUrl && (
          <section className="post-social-card">
            <div className="post-social-inner">
              <div className="post-social-header">
                <span className="post-pill post-pill-platform">
                  {(socialPlatform || 'instagram').toUpperCase()}
                </span>
                <span className="post-social-sub">
                  Linked social update
                </span>
              </div>

              <p className="post-social-copy">
                This noticeboard post includes a social media update. Tap
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
          </section>
        )}
      </div>

      <style jsx>{`
        /* MATCH DASHBOARD + NOTICEBOARD WIDTH */
        .post-page {
          display: flex;
          justify-content: center;
        }

        .post-inner {
          width: 100%;
          max-width: 520px; /* same as dashboard & nb-phone */
          padding: 12px 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .post-back {
          align-self: flex-start;
          margin-bottom: 4px;
          border: none;
          background: none;
          padding: 0;
          font-size: 13px;
          color: #4f46e5;
          cursor: pointer;
        }

        /* WHITE HEADER CARD */
        .post-header-card {
          border-radius: 20px;
          padding: 14px 16px 16px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
        }

        .post-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .post-date {
          font-size: 12px;
          color: #6b7280;
        }

        .post-title {
          margin: 4px 0 0;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .post-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .post-pill-pinned {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fbbf24;
        }

        /* BODY CARD */
        .post-body-card {
          border-radius: 20px;
          padding: 14px 16px 16px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
        }

        .post-body-text p {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.6;
          color: #111827;
        }

        /* SOCIAL CARD – BLUE GRADIENT */
        .post-social-card {
          border-radius: 22px;
          padding: 18px 20px;
          background: radial-gradient(
            circle at top left,
            #6366f1 0%,
            #312e81 40%,
            #111827 90%
          );
          box-shadow:
            0 26px 70px rgba(15, 23, 42, 0.75),
            0 0 0 1px rgba(59, 130, 246, 0.5);
          color: #e5e7eb;
        }

        .post-social-inner {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .post-pill-platform {
          background: rgba(15, 23, 42, 0.4);
          color: #e5e7eb;
          border: 1px solid rgba(191, 219, 254, 0.7);
        }

        .post-social-sub {
          font-size: 12px;
          color: #e5e7eb;
          opacity: 0.85;
          margin-left: 10px;
        }

        .post-social-copy {
          margin: 0;
          font-size: 13px;
        }

        .post-social-button {
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 18px;
          border-radius: 999px;
          background: linear-gradient(90deg, #4f46e5, #6366f1);
          color: #f9fafb;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.7);
        }

        @media (max-width: 720px) {
          .post-inner {
            padding: 10px 12px 12px;
          }

          .post-social-card {
            padding: 16px 14px;
          }
        }
      `}</style>
    </div>
  );
}