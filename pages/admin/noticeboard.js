// pages/admin/noticeboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../layout';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function AdminNoticeboard() {
  const router = useRouter();
  const { profile, isAdmin, loading: profileLoading } = useProfile();

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // IG / FB helper fields (also drive social_platform/social_url)
  const [igPlatform, setIgPlatform] = useState('instagram'); // 'instagram' | 'facebook' | etc.
  const [igUrl, setIgUrl] = useState('');
  const [igThumb, setIgThumb] = useState('');

  // Posts list
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Saving + edit mode
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ─────────────────────────────────────────────
  // Guard: only admins
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!profileLoading && !isAdmin) {
      // Non-admin: kick out to dashboard
      router.replace('/dashboard');
    }
  }, [profileLoading, isAdmin, router]);

  // ─────────────────────────────────────────────
  // Load posts
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function loadPosts() {
      try {
        setLoadingPosts(true);
        const { data, error } = await supabase
          .from('noticeboard_posts')
          .select(
            `
            id,
            title,
            body,
            created_at,
            is_pinned,
            ig_url,
            ig_thumbnail_url,
            ig_platform,
            social_platform,
            social_url
          `
          )
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading noticeboard posts:', error);
          setPosts([]);
        } else {
          setPosts(data || []);
        }
      } finally {
        setLoadingPosts(false);
      }
    }

    loadPosts();
  }, []);

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  function resetForm() {
    setTitle('');
    setBody('');
    setIsPinned(false);
    setIgPlatform('instagram');
    setIgUrl('');
    setIgThumb('');
    setEditingId(null);
  }

  function formatDateTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const hasSocial = igUrl.trim().length > 0;

  // ─────────────────────────────────────────────
  // Create / update post
  // ─────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() && !body.trim() && !hasSocial) {
      alert('Add at least a title, body, or social link.');
      return;
    }

    try {
      setSaving(true);

      const trimmedUrl = igUrl.trim();

      const payload = {
        title: title || null,
        body: body || null,
        is_pinned: isPinned,

        // Old IG-specific fields (for backwards compatibility)
        ig_url: hasSocial ? trimmedUrl : null,
        ig_thumbnail_url: hasSocial ? igThumb.trim() || null : null,
        ig_platform: hasSocial ? igPlatform : null,

        // New generic fields used by the public UI
        social_platform: hasSocial ? igPlatform : null,
        social_url: hasSocial ? trimmedUrl : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('noticeboard_posts')
          .update(payload)
          .eq('id', editingId);

        if (error) {
          console.error('Error updating post:', error);
          alert('Could not update post. Check console for details.');
        }
      } else {
        const { error } = await supabase
          .from('noticeboard_posts')
          .insert(payload);

        if (error) {
          console.error('Error creating post:', error);
          alert('Could not create post. Check console for details.');
        }
      }

      // Reload posts
      const { data: fresh, error: reloadError } = await supabase
        .from('noticeboard_posts')
        .select(
          `
          id,
          title,
          body,
          created_at,
          is_pinned,
          ig_url,
          ig_thumbnail_url,
          ig_platform,
          social_platform,
          social_url
        `
        )
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (reloadError) {
        console.error('Error reloading posts:', reloadError);
      } else {
        setPosts(fresh || []);
      }

      resetForm();
    } finally {
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────────
  // Delete post
  // ─────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm('Delete this noticeboard post?')) return;
    try {
      const { error } = await supabase
        .from('noticeboard_posts')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Error deleting post:', error);
        alert('Could not delete post.');
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      alert('Unexpected error deleting post.');
    }
  }

  // ─────────────────────────────────────────────
  // Edit existing post
  // ─────────────────────────────────────────────
  function startEdit(post) {
    // Prefer new generic fields, then fall back to old IG ones
    const platform =
      post.social_platform || post.ig_platform || 'instagram';
    const url = post.social_url || post.ig_url || '';

    setEditingId(post.id);
    setTitle(post.title || '');
    setBody(post.body || '');
    setIsPinned(!!post.is_pinned);
    setIgPlatform(platform);
    setIgUrl(url);
    setIgThumb(post.ig_thumbnail_url || '');
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  if (profileLoading || !isAdmin) {
    // While loading OR if user is not admin (redirect will happen)
    return (
      <Layout>
        <div className="admin-root">
          <p>Checking permissions…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-root">
        <section className="admin-card">
          <h1 className="admin-title">Noticeboard — Admin Panel</h1>

          <form onSubmit={handleSubmit} className="form-grid">
            {/* Left: main content */}
            <div className="form-main">
              <label className="field">
                <span className="field-label">Title</span>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Give this announcement a headline…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Body</span>
                <textarea
                  className="field-textarea"
                  placeholder="Write the announcement here…"
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </label>

              <label className="field-checkbox">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                <span>Pin this post</span>
              </label>
            </div>

            {/* Right: social helper */}
            <div className="form-side">
              <div className="helper-title">
                Instagram / Facebook Post Helper
              </div>
              <p className="helper-copy">
                Paste a link to a post you like on Instagram or Facebook. It
                will appear as a preview card on the dashboard and on the
                noticeboard, and clicking it will open the social post in a new
                tab.
              </p>

              <label className="field">
                <span className="field-label">Platform</span>
                <select
                  className="field-input"
                  value={igPlatform}
                  onChange={(e) => setIgPlatform(e.target.value)}
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">
                  {igPlatform === 'facebook'
                    ? 'Facebook post URL'
                    : 'Instagram post URL'}
                </span>
                <input
                  type="url"
                  className="field-input"
                  placeholder="https://www.instagram.com/p/…"
                  value={igUrl}
                  onChange={(e) => setIgUrl(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">
                  Thumbnail image URL (optional)
                </span>
                <input
                  type="url"
                  className="field-input"
                  placeholder="Paste an image URL for the preview card…"
                  value={igThumb}
                  onChange={(e) => setIgThumb(e.target.value)}
                />
              </label>

              {/* Live preview */}
              {hasSocial && (
                <div className="helper-preview">
                  {igThumb && (
                    <div
                      className="helper-thumb"
                      style={{
                        backgroundImage: `url(${igThumb})`,
                      }}
                    />
                  )}
                  <div className="helper-preview-main">
                    <div className="helper-pill-row">
                      <span className="helper-pill-platform">
                        {igPlatform.toUpperCase()}
                      </span>
                      {isPinned && (
                        <span className="helper-pill-pinned">
                          PINNED
                        </span>
                      )}
                    </div>
                    <div className="helper-preview-title">
                      {title || 'Social post preview'}
                    </div>
                    <div className="helper-preview-sub">
                      This link will open in a new tab.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving…'
                  : editingId
                  ? 'Update Post'
                  : 'Create Post'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Existing posts */}
        <section className="admin-card">
          <h2 className="admin-subtitle">Existing posts</h2>

          {loadingPosts ? (
            <p className="posts-empty">Loading posts…</p>
          ) : posts.length === 0 ? (
            <p className="posts-empty">
              No posts yet. Create one above.
            </p>
          ) : (
            <div className="posts-list">
              {posts.map((post) => {
                // Prefer new generic fields, fall back to legacy IG ones
                const platform =
                  post.social_platform || post.ig_platform;
                const socialUrl = post.social_url || post.ig_url;

                return (
                  <div
                    key={post.id}
                    className={
                      socialUrl
                        ? 'post-card post-card-social'
                        : 'post-card'
                    }
                  >
                    {post.ig_thumbnail_url && (
                      <div
                        className="post-thumb"
                        style={{
                          backgroundImage: `url(${post.ig_thumbnail_url})`,
                        }}
                      />
                    )}

                    <div className="post-main">
                      <div className="post-header-row">
                        <div>
                          <h3 className="post-title">
                            {post.title || 'Announcement'}
                          </h3>
                          <div className="post-date">
                            {formatDateTime(post.created_at)}
                          </div>
                        </div>
                        <div className="post-pill-row">
                          {post.is_pinned && (
                            <span className="post-pill post-pill-pinned">
                              PINNED
                            </span>
                          )}
                          {socialUrl && (
                            <span className="post-pill post-pill-platform">
                              {(platform || 'instagram').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {post.body && (
                        <p className="post-body">
                          {post.body.length > 180
                            ? post.body.slice(0, 180) + '…'
                            : post.body}
                        </p>
                      )}

                      {socialUrl && (
                        <a
                          href={socialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="post-ig-link"
                        >
                          View social post →
                        </a>
                      )}

                      <div className="post-actions">
                        <button
                          type="button"
                          className="secondary-btn small"
                          onClick={() => startEdit(post)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-btn small"
                          onClick={() => handleDelete(post.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* styles (unchanged from your original) */}
        <style jsx>{`
          .admin-root {
            max-width: 1040px;
            margin: 0 auto;
            padding: 18px 16px 80px;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .admin-card {
            border-radius: 22px;
            padding: 18px 20px 20px;
            background: rgba(3, 6, 40, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.16);
            box-shadow: 0 22px 55px rgba(0, 0, 0, 0.9);
          }

          .admin-title {
            margin: 0 0 16px;
            font-size: 24px;
            font-weight: 600;
          }

          .admin-subtitle {
            margin: 0 0 12px;
            font-size: 18px;
          }

          .form-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.2fr);
            gap: 18px;
          }

          .form-main,
          .form-side {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .field {
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

          .field-input,
          .field-textarea,
          select.field-input {
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(2, 3, 24, 0.9);
            color: #ffffff;
            padding: 8px 10px;
            font-size: 13px;
            outline: none;
          }

          .field-input:focus,
          .field-textarea:focus,
          select.field-input:focus {
            border-color: rgba(255, 255, 255, 0.4);
          }

          .field-textarea {
            resize: vertical;
          }

          .field-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
          }

          .helper-title {
            font-size: 13px;
            font-weight: 600;
          }

          .helper-copy {
            font-size: 12px;
            opacity: 0.85;
          }

          .helper-preview {
            margin-top: 8px;
            display: flex;
            gap: 10px;
            border-radius: 18px;
            padding: 10px 12px;
            background: linear-gradient(135deg, #e84a5f, #b95dff);
            box-shadow: 0 18px 42px rgba(0, 0, 0, 0.95);
          }

          .helper-thumb {
            width: 88px;
            border-radius: 14px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            flex-shrink: 0;
          }

          .helper-preview-main {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .helper-pill-row {
            display: flex;
            gap: 6px;
          }

          .helper-pill-platform,
          .helper-pill-pinned {
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            background: rgba(0, 0, 0, 0.35);
          }

          .helper-pill-pinned {
            background: rgba(0, 0, 0, 0.6);
          }

          .helper-preview-title {
            font-size: 13px;
            font-weight: 600;
          }

          .helper-preview-sub {
            font-size: 11px;
            opacity: 0.9;
          }

          .form-actions {
            grid-column: 1 / -1;
            display: flex;
            gap: 10px;
            margin-top: 4px;
          }

          .primary-btn,
          .secondary-btn,
          .danger-btn {
            border-radius: 999px;
            padding: 9px 18px;
            border: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
          }

          .primary-btn {
            background: linear-gradient(90deg, #ff8b5f, #0a147c);
            color: #ffffff;
          }

          .secondary-btn {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
          }

          .danger-btn {
            background: #d94841;
            color: #ffffff;
          }

          .small {
            padding: 6px 14px;
            font-size: 12px;
          }

          .posts-empty {
            font-size: 13px;
            opacity: 0.85;
          }

          .posts-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .post-card {
            border-radius: 18px;
            padding: 12px 14px 12px;
            background: rgba(3, 6, 40, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.12);
            display: flex;
            gap: 12px;
          }

          .post-card-social {
            background: radial-gradient(
              circle at top left,
              #171f76 0%,
              #020316 70%
            );
          }

          .post-thumb {
            width: 96px;
            border-radius: 14px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            flex-shrink: 0;
          }

          .post-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .post-header-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
          }

          .post-title {
            margin: 0;
            font-size: 16px;
          }

          .post-date {
            font-size: 11px;
            opacity: 0.8;
          }

          .post-pill-row {
            display: flex;
            gap: 6px;
            flex-shrink: 0;
          }

          .post-pill {
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .post-pill-pinned {
            background: rgba(255, 255, 255, 0.16);
          }

          .post-pill-platform {
            background: linear-gradient(135deg, #e84a5f, #b95dff);
          }

          .post-body {
            margin: 2px 0 4px;
            font-size: 13px;
            opacity: 0.92;
          }

          .post-ig-link {
            font-size: 12px;
            text-decoration: none;
            color: #f6e7b8;
          }

          .post-actions {
            margin-top: 6px;
            display: flex;
            gap: 8px;
          }

          @media (max-width: 900px) {
            .form-grid {
              grid-template-columns: minmax(0, 1fr);
            }
          }

          @media (max-width: 720px) {
            .post-card {
              flex-direction: column;
            }

            .post-thumb {
              width: 100%;
              height: 150px;
            }

            .post-header-row {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}