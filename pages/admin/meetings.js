// pages/admin/meetings.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../layout';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function AdminMeetingsPage() {
  const router = useRouter();
  const { profile, isAdmin, loading: profileLoading } = useProfile();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [saving, setSaving] = useState(false);

  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  // Redirect non-admins away
  useEffect(() => {
    if (!profileLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [profileLoading, isAdmin, router]);

  // Load all meetings
  useEffect(() => {
    async function loadMeetings() {
      try {
        setLoadingMeetings(true);
        const { data, error } = await supabase
          .from('meetings')
          .select('id, title, description, scheduled_for, created_at, is_cancelled')
          .order('scheduled_for', { ascending: true });

        if (error) {
          console.error('Error loading meetings:', error);
          setMeetings([]);
        } else {
          setMeetings(data || []);
        }
      } finally {
        setLoadingMeetings(false);
      }
    }

    if (isAdmin) {
      loadMeetings();
    }
  }, [isAdmin]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || !scheduledFor) {
      alert('Please enter a title and date/time.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('meetings').insert({
        title: title.trim(),
        description: description.trim() || null,
        scheduled_for: new Date(scheduledFor).toISOString(),
      });

      if (error) {
        console.error('Error creating meeting:', error);
        alert('Could not create meeting. Check console for details.');
        return;
      }

      setTitle('');
      setDescription('');
      setScheduledFor('');

      // refresh list
      const { data } = await supabase
        .from('meetings')
        .select('id, title, description, scheduled_for, created_at, is_cancelled')
        .order('scheduled_for', { ascending: true });

      setMeetings(data || []);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCancelled(meeting) {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ is_cancelled: !meeting.is_cancelled })
        .eq('id', meeting.id);

      if (error) {
        console.error('Error updating meeting:', error);
        alert('Could not update meeting.');
        return;
      }

      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meeting.id ? { ...m, is_cancelled: !m.is_cancelled } : m
        )
      );
    } catch (err) {
      console.error('Unexpected toggleCancelled error:', err);
    }
  }

  async function handleDelete(meetingId) {
    if (!confirm('Delete this meeting permanently?')) return;

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) {
        console.error('Error deleting meeting:', error);
        alert('Could not delete meeting.');
        return;
      }

      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    } catch (err) {
      console.error('Unexpected delete error:', err);
    }
  }

  function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString();
  }

  if (profileLoading || !isAdmin) {
    return (
      <Layout>
        <p style={{ padding: 16, opacity: 0.8 }}>Checking admin access…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-root">
        <section className="card">
          <h1 className="card-title">Meetings — Admin Panel</h1>

          <form className="form" onSubmit={handleCreate}>
            <label className="label">
              Title
              <input
                type="text"
                className="input"
                placeholder="e.g. Core Foundations Q&A – Week 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="label">
              Description
              <textarea
                className="textarea"
                placeholder="Optional: add agenda, Zoom link, notes…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </label>

            <label className="label">
              Scheduled for
              <input
                type="datetime-local"
                className="input"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </label>

            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Create Meeting'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="card-title">Existing meetings</h2>

          {loadingMeetings ? (
            <p className="empty">Loading meetings…</p>
          ) : meetings.length === 0 ? (
            <p className="empty">No meetings scheduled yet.</p>
          ) : (
            <div className="list">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className={
                    'meeting-row' +
                    (meeting.is_cancelled ? ' meeting-row--cancelled' : '')
                  }
                >
                  <div className="meeting-main">
                    <div className="meeting-title">{meeting.title}</div>
                    <div className="meeting-meta">
                      {formatDateTime(meeting.scheduled_for)}
                      {meeting.is_cancelled && (
                        <span className="pill pill-cancelled">Cancelled</span>
                      )}
                    </div>
                    {meeting.description && (
                      <div className="meeting-desc">{meeting.description}</div>
                    )}
                  </div>

                  <div className="meeting-actions">
                    <button
                      type="button"
                      className="pill-btn"
                      onClick={() => toggleCancelled(meeting)}
                    >
                      {meeting.is_cancelled ? 'Mark active' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      className="pill-btn pill-btn--danger"
                      onClick={() => handleDelete(meeting.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .admin-root {
          max-width: 960px;
          margin: 0 auto;
          padding: 16px 16px 80px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .card {
          border-radius: 20px;
          padding: 16px 18px 18px;
          background: rgba(3, 6, 40, 0.98);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .card-title {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 600;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .label {
          display: flex;
          flex-direction: column;
          font-size: 13px;
          gap: 4px;
        }

        .input,
        .textarea {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(5, 10, 64, 0.96);
          padding: 8px 10px;
          color: #fff;
          font-size: 14px;
          outline: none;
        }

        .input:focus,
        .textarea:focus {
          border-color: #f8b45a;
          box-shadow: 0 0 0 1px rgba(248, 180, 90, 0.6);
        }

        .textarea {
          resize: vertical;
        }

        .primary-btn {
          margin-top: 4px;
          border: none;
          border-radius: 999px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(90deg, #d94841, #ff8b5f);
          color: #fff;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.85);
        }

        .primary-btn:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .empty {
          margin: 0;
          font-size: 13px;
          opacity: 0.85;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .meeting-row {
          border-radius: 14px;
          padding: 10px 12px;
          background: radial-gradient(
            circle at top left,
            #1d2a8c 0%,
            #050a3a 75%
          );
          border: 1px solid rgba(255, 255, 255, 0.22);
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .meeting-row--cancelled {
          opacity: 0.6;
        }

        .meeting-main {
          flex: 1;
        }

        .meeting-title {
          font-size: 14px;
          font-weight: 600;
        }

        .meeting-meta {
          margin-top: 2px;
          font-size: 12px;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .meeting-desc {
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.9;
        }

        .meeting-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          background: rgba(0, 0, 0, 0.4);
        }

        .pill-cancelled {
          background: rgba(200, 60, 80, 0.9);
        }

        .pill-btn {
          border: none;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.4);
          color: #fff;
        }

        .pill-btn--danger {
          background: rgba(180, 40, 60, 0.9);
        }

        @media (max-width: 720px) {
          .admin-root {
            padding-bottom: 100px;
          }
        }
      `}</style>
    </Layout>
  );
}