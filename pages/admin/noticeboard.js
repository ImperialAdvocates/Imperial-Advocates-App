// pages/admin/noticeboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function AdminNoticeboard() {
  const router = useRouter();
  const { profile, isAdmin, loading: profileLoading } = useProfile();

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Social helper fields (generic)
  const [igPlatform, setIgPlatform] = useState('instagram'); // 'instagram' | 'facebook'
  const [igUrl, setIgUrl] = useState('');
  const [igThumb, setIgThumb] = useState('');

  // Posts list
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Saving + edit mode
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Redirect non-admins away
  useEffect(() => {
    if (!profileLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [profileLoading, isAdmin, router]);

  // Load posts
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

  // Helpers
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

  // Create / update post
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

        // Legacy IG fields
        ig_url: hasSocial ? trimmedUrl : null,
        ig_thumbnail_url: hasSocial ? igThumb.trim() || null : null,
        ig_platform: hasSocial ? igPlatform : null,

        // New generic fields
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

  // Delete post
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

  // Edit existing post
  function startEdit(post) {
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

  const displayName =
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'admin');

  // ─────────────────────────────────────────────
  // RENDER – same shell pattern as admin/index
  // ─────────────────────────────────────────────
  if (profileLoading) {
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
    return (
      <div className="admin-screen">
        <div className="admin-inner">
          <section className="admin-header-card">
            <p className="admin-eyebrow">ADMIN</p>
            <h1 className="admin-title">No access</h1>
            <p className="admin-sub">
              You don&apos;t have access to this page.
            </p>
            <a href="/dashboard" className="admin-link">
              ← Back to dashboard
            </a>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="admin-screen">
      <div className="admin-inner">
        {/* HEADER */}
        <section className="admin-header-card">
          <p className="admin-eyebrow">ADMIN • NOTICEBOARD</p>
          <h1 className="admin-title">Noticeboard manager</h1>
          <p className="admin-sub">
            Create and edit investor updates. Pinned posts appear at the top
            of the noticeboard and latest updates on the dashboard.
          </p>
          <p className="admin-sub small">
            Logged in as <strong>{displayName}</strong>.
          </p>
        </section>

        {/* CREATE / EDIT FORM */}
        <section className="admin-card">
          <h2 className="admin-card-title">
            {editingId ? 'Edit noticeboard post' : 'Create new post'}
          </h2>

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
                Social post helper (optional)
              </div>
              <p className="helper-copy">
                Paste a link to an Instagram or Facebook post. It will appear
                as a social preview on the noticeboard and in some dashboard
                views. Clicking it will open the post in a new tab.
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
                        <span className="helper-pill-pinned">PINNED</span>
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
                  ? 'Update post'
                  : 'Create post'}
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
          <h2 className="admin-card-title">Existing posts</h2>

          {loadingPosts ? (
            <p className="posts-empty">Loading posts…</p>
          ) : posts.length === 0 ? (
            <p className="posts-empty">
              No posts yet. Create one above.
            </p>
          ) : (
            <div className="posts-list">
              {posts.map((post) => {
                const platform = post.social_platform || post.ig_platform;
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

        <div className="admin-bottom-safe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  /* Same shell as dashboard/admin index */
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
  }

  .admin-sub.small {
    font-size: 12px;
    margin-top: 4px;
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

  /* MAIN CARDS */
  .admin-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: #ffffff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
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

  /* FORM GRID */
  .form-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.2fr);
    gap: 14px;
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
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #6b7280;
  }

  .field-input,
  .field-textarea,
  select.field-input {
    border-radius: 10px;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    color: #111827;
    padding: 8px 10px;
    font-size: 13px;
    outline: none;
  }

  .field-input:focus,
  .field-textarea:focus,
  select.field-input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.15);
    background: #ffffff;
  }

  .field-textarea {
    resize: vertical;
    min-height: 110px;
  }

  .field-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #111827;
  }

  .helper-title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }

  .helper-copy {
    font-size: 12px;
    color: #6b7280;
    margin: 0 0 4px;
  }

  .helper-preview {
    margin-top: 8px;
    display: flex;
    gap: 10px;
    border-radius: 16px;
    padding: 10px 12px;
    background: linear-gradient(135deg, #f97316, #6366f1);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.4);
    color: #ffffff;
  }

  .helper-thumb {
    width: 80px;
    border-radius: 12px;
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
    background: rgba(0, 0, 0, 0.3);
  }

  .helper-pill-pinned {
    background: rgba(0, 0, 0, 0.5);
  }

  .helper-preview-title {
    font-size: 13px;
    font-weight: 600;
  }

  .helper-preview-sub {
    font-size: 11px;
    opacity: 0.95;
  }

  .form-actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 8px;
    margin-top: 2px;
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
    white-space: nowrap;
  }

  .primary-btn {
    background: linear-gradient(135deg, #f97316, #ec4899);
    color: #ffffff;
    box-shadow: 0 12px 28px rgba(249, 115, 22, 0.35);
  }

  .primary-btn:disabled {
    opacity: 0.8;
    cursor: default;
  }

  .secondary-btn {
    background: #f3f4f6;
    color: #111827;
  }

  .danger-btn {
    background: #ef4444;
    color: #ffffff;
  }

  .small {
    padding: 6px 14px;
    font-size: 12px;
  }

  /* POSTS LIST */
  .posts-empty {
    font-size: 13px;
    color: #6b7280;
  }

  .posts-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .post-card {
    border-radius: 16px;
    padding: 10px 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    display: flex;
    gap: 10px;
  }

  .post-card-social {
    background: linear-gradient(135deg, #eff6ff, #eef2ff);
  }

  .post-thumb {
    width: 80px;
    border-radius: 12px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    flex-shrink: 0;
  }

  .post-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .post-header-row {
    display: flex;
    justify-content: space-between;
    gap: 6px;
  }

  .post-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .post-date {
    font-size: 11px;
    color: #6b7280;
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
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fbbf24;
  }

  .post-pill-platform {
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid #a5b4fc;
  }

  .post-body {
    margin: 2px 0 2px;
    font-size: 12px;
    color: #4b5563;
  }

  .post-ig-link {
    font-size: 12px;
    color: #4f46e5;
    text-decoration: none;
  }

  .post-ig-link:hover {
    text-decoration: underline;
  }

  .post-actions {
    margin-top: 4px;
    display: flex;
    gap: 6px;
  }

  .admin-bottom-safe {
    height: 60px;
  }

  @media (max-width: 900px) {
    .form-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 720px) {
    .admin-screen {
      padding: 10px 12px 80px;
    }

    .admin-card {
      padding: 12px 12px 14px;
    }

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

    .admin-bottom-safe {
      height: 80px;
    }
  }
`;