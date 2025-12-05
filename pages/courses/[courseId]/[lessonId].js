// pages/courses/[courseId]/[lessonId].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useProfile } from '../../../hooks/useProfile';

// Helper: convert Google Drive "file" URL → embeddable preview URL
function getDriveEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('drive.google.com')) return null;

  // Handles links like:
  // https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
  const match = url.match(/\/d\/([^/]+)/);
  if (!match || !match[1]) return null;

  const fileId = match[1];
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export default function LessonPage() {
  const router = useRouter();
  const { courseId, lessonId } = router.query;
  const { profile } = useProfile() || {};

  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  // For navigating prev/next
  const [currentIndex, setCurrentIndex] = useState(null);

  // ─────────────────────────────────────────────
  // Load course, lessons, this lesson + progress
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!courseId || !lessonId) return;
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // Get user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error getting auth user:', userError);
        }

        // Course (title for header / breadcrumbs)
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId)
          .single();

        if (courseError) {
          console.error('Error loading course:', courseError);
        }

        // All lessons for outline + index
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('lesson_index', { ascending: true });

        if (lessonsError) {
          console.error('Error loading lessons:', lessonsError);
        }

        // Current lesson (from list so index matches)
        const lessonFromList = (lessonsData || []).find(
          (l) => String(l.id) === String(lessonId),
        );

        // Progress for this lesson
        let completed = false;
        if (user) {
          const { data: progressRows, error: progressError } = await supabase
            .from('lesson_progress')
            .select('lesson_id, completed_at')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('lesson_id', lessonId)
            .limit(1);

          if (progressError) {
            console.error('Error loading lesson progress:', progressError);
          } else if (progressRows && progressRows.length > 0) {
            completed = true;
          }
        }

        if (!isMounted) return;

        setCourse(courseData || null);
        setLessons(lessonsData || []);
        setLesson(lessonFromList || null);
        setIsCompleted(completed);

        if (lessonsData && lessonFromList) {
          const idx = lessonsData.findIndex(
            (l) => String(l.id) === String(lessonFromList.id),
          );
          setCurrentIndex(idx === -1 ? null : idx);
        }
      } catch (err) {
        console.error('Unexpected lesson page error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId]);

  const displayName =
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'Investor');

  // ─────────────────────────────────────────────
  // Mark lesson complete / incomplete
  // ─────────────────────────────────────────────
  async function toggleCompletion() {
    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('No user for marking completion', userError);
        return;
      }

      if (!isCompleted) {
        // Mark as complete (upsert – let Supabase use the table PK/unique constraint)
        const payload = {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('lesson_progress')
          .upsert(payload);

        if (error) {
          console.error('Error marking lesson complete:', error);
          return;
        }

        setIsCompleted(true);
      } else {
        // Optional: un-complete by deleting the row
        const { error } = await supabase
          .from('lesson_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('lesson_id', lessonId);

        if (error) {
          console.error('Error clearing completion:', error);
          return;
        }

        setIsCompleted(false);
      }
    } finally {
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────────
  // Navigation helpers
  // ─────────────────────────────────────────────
  const prevLesson =
    currentIndex !== null && currentIndex > 0
      ? lessons[currentIndex - 1]
      : null;

  const nextLesson =
    currentIndex !== null && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  if (loading && !lesson) {
    return (
      <div className="lesson-root">
        <p className="loading-text">Loading lesson…</p>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="lesson-root">
        <div className="missing-wrap">
          <h1 className="missing-title">Lesson not found</h1>
          <p className="missing-text">
            We couldn&apos;t find this lesson. It may have been removed or
            you don&apos;t have access.
          </p>
          <Link href={`/courses/${courseId || ''}`} className="back-link">
            ← Back to course
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = lessons.length;

  // Decide how to render the video: direct URL, or Google Drive embed
  const hasDirectVideo = !!lesson.video_url && !lesson.video_url.includes('drive.google.com');
  const driveEmbedUrl = getDriveEmbedUrl(lesson.video_url || '');
  const hasDriveVideo = !!driveEmbedUrl;

  return (
    <div className="lesson-root">
      {/* HEADER / BREADCRUMB */}
      <section className="lesson-header">
        <div className="header-left">
          <div className="header-eyebrow">LESSON • IMPERIAL TRAINING</div>
          <h1 className="header-title">{lesson.title}</h1>
          <div className="header-sub">
            <span className="crumb">
              <Link href="/courses" className="crumb-link">
                All courses
              </Link>
            </span>
            <span className="crumb-separator">/</span>
            <span className="crumb">
              <Link
                href={`/courses/${course.id}`}
                className="crumb-link"
              >
                {course.title}
              </Link>
            </span>
            <span className="crumb-separator">/</span>
            <span className="crumb crumb-current">
              Lesson {currentIndex !== null ? currentIndex + 1 : '—'}
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="header-user-pill">
            Logged in as <span>{displayName}</span>
          </div>
          <button
            type="button"
            className={
              'complete-btn ' + (isCompleted ? 'complete-btn--done' : '')
            }
            onClick={toggleCompletion}
            disabled={saving}
          >
            {saving
              ? 'Saving…'
              : isCompleted
              ? 'Mark as not complete'
              : 'Mark lesson complete'}
          </button>
        </div>
      </section>

      {/* MAIN LAYOUT: video + sidebar */}
      <section className="lesson-main">
        {/* LEFT: Video & content */}
        <div className="lesson-main-left">
          {/* Video card */}
          <div className="video-card">
            {hasDirectVideo ? (
              <video
                className="lesson-video"
                src={lesson.video_url}
                controls
                controlsList="nodownload"
              />
            ) : hasDriveVideo ? (
              <div className="embed-wrap">
                <iframe
                  src={driveEmbedUrl}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : lesson.embed_url ? (
              <div className="embed-wrap">
                <iframe
                  src={lesson.embed_url}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="video-placeholder">
                <div className="video-grad" />
                <div className="video-text">
                  <h2>Lesson video coming soon</h2>
                  <p>
                    This is where the training video for this lesson will
                    appear once it&apos;s uploaded.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson content card (optional fields, safe if null) */}
          <div className="content-card">
            <h2 className="content-title">Lesson notes</h2>
            {lesson.description || lesson.summary || lesson.notes ? (
              <p className="content-lead">
                {lesson.description || lesson.summary || lesson.notes}
              </p>
            ) : (
              <p className="content-lead">
                Use this space for your own notes as you watch the lesson.
              </p>
            )}

            {lesson.body || lesson.content ? (
              <div className="content-body">
                {(lesson.body || lesson.content)
                  .split(/\n{2,}/)
                  .map((block, idx) => (
                    <p key={idx}>{block}</p>
                  ))}
              </div>
            ) : null}
          </div>

          {/* Prev/Next navigation */}
          <div className="nav-row">
            {prevLesson ? (
              <Link
                href={`/courses/${course.id}/${prevLesson.id}`}
                className="nav-link nav-link--ghost"
              >
                ← Previous lesson
              </Link>
            ) : (
              <span className="nav-spacer" />
            )}

            {nextLesson ? (
              <Link
                href={`/courses/${course.id}/${nextLesson.id}`}
                className="nav-link"
              >
                Next lesson →
              </Link>
            ) : (
              <Link
                href={`/courses/${course.id}`}
                className="nav-link nav-link--ghost"
              >
                Back to course overview
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT: lesson outline */}
        <aside className="lesson-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header-row">
              <h3>Lesson outline</h3>
              <span className="sidebar-count">
                {currentIndex !== null ? currentIndex + 1 : '–'}/
                {totalLessons}
              </span>
            </div>

            <div className="sidebar-list">
              {lessons.map((l, index) => {
                const isCurrent =
                  String(l.id) === String(lesson.id);
                return (
                  <Link
                    key={l.id}
                    href={`/courses/${course.id}/${l.id}`}
                    className={
                      'sidebar-item ' +
                      (isCurrent ? 'sidebar-item--current' : '')
                    }
                  >
                    <div className="sidebar-index">{index + 1}</div>
                    <div className="sidebar-text">
                      <div className="sidebar-title">{l.title}</div>
                      {isCurrent && (
                        <div className="sidebar-tag">Current lesson</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      <style jsx>{`
        .lesson-root {
          max-width: 1120px;
          margin: 0 auto;
          padding: 16px 16px 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .loading-text {
          font-size: 13px;
          opacity: 0.85;
        }

        .missing-wrap {
          max-width: 640px;
          padding: 18px 20px;
          border-radius: 20px;
          background: rgba(3, 6, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
        }

        .missing-title {
          margin: 0 0 6px;
          font-size: 20px;
        }

        .missing-text {
          margin: 0 0 10px;
          font-size: 13px;
          opacity: 0.88;
        }

        .back-link {
          font-size: 13px;
          color: #f6e7b8;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        /* HEADER */
        .lesson-header {
          border-radius: 22px;
          padding: 16px 18px 18px;
          background: radial-gradient(
            circle at top left,
            #1a2a8a 0%,
            #060b3e 45%,
            #020316 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 20px 52px rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .header-left {
          max-width: 640px;
        }

        .header-eyebrow {
          margin: 0 0 4px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .header-title {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 700;
        }

        .header-sub {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          opacity: 0.9;
        }

        .crumb-link {
          color: #f6e7b8;
          text-decoration: none;
        }

        .crumb-link:hover {
          text-decoration: underline;
        }

        .crumb-separator {
          opacity: 0.7;
        }

        .crumb-current {
          opacity: 0.95;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }

        .header-user-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.35);
        }

        .header-user-pill span {
          margin-left: 6px;
          font-weight: 600;
        }

        .complete-btn {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(2, 4, 32, 0.9);
          color: #fef7dd;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.8);
          transition: background 0.12s ease-out, transform 0.08s ease-out,
            box-shadow 0.12s ease-out, border-color 0.12s ease-out;
        }

        .complete-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.95);
        }

        .complete-btn--done {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: #bbf7d0;
          color: #020316;
        }

        .complete-btn[disabled] {
          opacity: 0.7;
          cursor: default;
        }

        /* MAIN LAYOUT */
        .lesson-main {
          display: grid;
          grid-template-columns: minmax(0, 2.1fr) minmax(0, 1fr);
          gap: 16px;
          align-items: flex-start;
        }

        .lesson-main-left {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Video card */
        .video-card {
          border-radius: 20px;
          overflow: hidden;
          background: #020316;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 52px rgba(0, 0, 0, 0.9);
        }

        .lesson-video {
          width: 100%;
          display: block;
          max-height: 480px;
          background: #000;
        }

        .embed-wrap {
          position: relative;
          padding-top: 56.25%;
        }

        .embed-wrap iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .video-placeholder {
          position: relative;
          padding: 40px 18px 20px;
          overflow: hidden;
        }

        .video-grad {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at top left,
            rgba(248, 180, 90, 0.5),
            rgba(8, 12, 72, 1)
          );
          opacity: 0.85;
        }

        .video-text {
          position: relative;
          max-width: 420px;
        }

        .video-text h2 {
          margin: 0 0 6px;
          font-size: 18px;
        }

        .video-text p {
          margin: 0;
          font-size: 13px;
          opacity: 0.9;
        }

        /* Content card */
        .content-card {
          border-radius: 18px;
          padding: 14px 16px 16px;
          background: rgba(3, 6, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 18px 46px rgba(0, 0, 0, 0.9);
        }

        .content-title {
          margin: 0 0 4px;
          font-size: 16px;
        }

        .content-lead {
          margin: 0 0 10px;
          font-size: 13px;
          opacity: 0.9;
        }

        .content-body p {
          margin: 0 0 8px;
          font-size: 13px;
          opacity: 0.95;
        }

        /* Prev/next row */
        .nav-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 4px;
        }

        .nav-link {
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          color: #020316;
          background: linear-gradient(135deg, #f8b45a, #ff8b5f);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.9);
        }

        .nav-link--ghost {
          background: rgba(3, 6, 40, 0.98);
          color: #fef7dd;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .nav-spacer {
          width: 120px;
        }

        /* Sidebar */
        .lesson-sidebar {
          position: sticky;
          top: 96px;
        }

        .sidebar-card {
          border-radius: 18px;
          padding: 12px 14px 14px;
          background: rgba(4, 7, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 18px 46px rgba(0, 0, 0, 0.9);
        }

        .sidebar-header-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }

        .sidebar-header-row h3 {
          margin: 0;
          font-size: 14px;
        }

        .sidebar-count {
          font-size: 12px;
          opacity: 0.8;
        }

        .sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 420px;
          overflow: auto;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 9px;
          border-radius: 10px;
          text-decoration: none;
          color: #e5e7eb;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid transparent;
          font-size: 12px;
        }

        .sidebar-item--current {
          border-color: rgba(248, 180, 90, 0.9);
          background: radial-gradient(
            circle at top left,
            rgba(248, 180, 90, 0.35),
            rgba(15, 23, 42, 0.95)
          );
        }

        .sidebar-index {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }

        .sidebar-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-title {
          font-size: 12px;
          font-weight: 500;
        }

        .sidebar-tag {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          opacity: 0.8;
        }

        @media (max-width: 900px) {
          .lesson-main {
            grid-template-columns: minmax(0, 1fr);
          }

          .lesson-sidebar {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .lesson-root {
            padding: 12px 12px 32px;
          }

          .lesson-header {
            flex-direction: column;
          }

          .header-right {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}