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

  const [currentIndex, setCurrentIndex] = useState(null);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) console.error('Error getting auth user:', userError);

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId)
          .single();

        if (courseError) console.error('Error loading course:', courseError);

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('lesson_index', { ascending: true });

        if (lessonsError) console.error('Error loading lessons:', lessonsError);

        const lessonFromList = (lessonsData || []).find(
          (l) => String(l.id) === String(lessonId),
        );

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
        const payload = {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('lesson_progress').upsert(payload);
        if (error) {
          console.error('Error marking lesson complete:', error);
          return;
        }
        setIsCompleted(true);
      } else {
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

  const prevLesson =
    currentIndex !== null && currentIndex > 0 ? lessons[currentIndex - 1] : null;

  const nextLesson =
    currentIndex !== null && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  const lessonNumber = currentIndex !== null ? `Lesson ${currentIndex + 1}` : 'Lesson';

  const hasDirectVideo =
    !!lesson?.video_url && !lesson.video_url.includes('drive.google.com');
  const driveEmbedUrl = getDriveEmbedUrl(lesson?.video_url || '');
  const hasDriveVideo = !!driveEmbedUrl;

  if (loading && !lesson) {
    return (
      <div className="lesson-screen">
        <div className="lesson-phone">
          <div className="lesson-header">
            <p className="lesson-eyebrow">LESSON</p>
            <h1 className="lesson-title">Loading lesson…</h1>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="lesson-screen">
        <div className="lesson-phone">
          <div className="lesson-header">
            <p className="lesson-eyebrow">LESSON</p>
            <h1 className="lesson-title">Lesson not found</h1>
            <p className="lesson-breadcrumbs">
              It may have been removed or you don&apos;t have access.
            </p>
          </div>

          <div className="lesson-notes-card">
            <Link href={`/courses/${courseId || ''}`}>
              ← Back to course overview
            </Link>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const totalLessons = lessons.length;

  return (
    <div className="lesson-screen">
      <div className="lesson-phone">
        {/* HEADER CARD */}
        <header className="lesson-header">
          <p className="lesson-eyebrow">IMPERIAL TRAINING</p>
          <h1 className="lesson-title">{lesson.title}</h1>
          <p className="lesson-breadcrumbs">
            <Link href="/courses">All courses</Link> ·{' '}
            <Link href={`/courses/${course.id}`}>{course.title}</Link> ·{' '}
            {lessonNumber} of {totalLessons || '—'}
          </p>

          <div className="lesson-header-bottom-row">
            <div className="lesson-user-pill">
              Logged in as <span>{displayName}</span>
            </div>

            <button
              type="button"
              className={
                'lesson-complete-btn ' + (isCompleted ? 'lesson-complete-btn--done' : '')
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
        </header>

        {/* VIDEO CARD */}
        <section className="lesson-video-card">
          {hasDirectVideo ? (
            <video src={lesson.video_url} controls controlsList="nodownload" />
          ) : hasDriveVideo ? (
            <iframe
              src={driveEmbedUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : lesson.embed_url ? (
            <iframe
              src={lesson.embed_url}
              title={lesson.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="lesson-video-placeholder">
              <p>Lesson video coming soon.</p>
            </div>
          )}
        </section>

        {/* NOTES CARD */}
        <section className="lesson-notes-card">
          <h2 className="lesson-notes-title">Lesson notes</h2>
          <div className="lesson-notes-text">
            {lesson.description || lesson.summary || lesson.notes ? (
              <p>{lesson.description || lesson.summary || lesson.notes}</p>
            ) : (
              <p>Use this space to take notes while you watch the lesson.</p>
            )}

            {(lesson.body || lesson.content) &&
              (lesson.body || lesson.content)
                .split(/\n{2,}/)
                .map((block, idx) => <p key={idx}>{block}</p>)}
          </div>
        </section>

        {/* NAV ROW */}
        <section className="lesson-nav-row">
          {prevLesson ? (
            <Link
              href={`/courses/${course.id}/${prevLesson.id}`}
              className="lesson-nav-link lesson-nav-link--ghost"
            >
              ← Previous lesson
            </Link>
          ) : (
            <span />
          )}

          {nextLesson ? (
            <Link
              href={`/courses/${course.id}/${nextLesson.id}`}
              className="lesson-nav-link lesson-nav-link--primary"
            >
              Next lesson →
            </Link>
          ) : (
            <Link
              href={`/courses/${course.id}`}
              className="lesson-nav-link lesson-nav-link--ghost"
            >
              Back to course overview
            </Link>
          )}
        </section>

        {/* OUTLINE CARD */}
        <section className="lesson-outline-card">
          <div className="outline-header">
            <h2 className="outline-title">Lesson outline</h2>
            <span className="outline-count">
              {currentIndex !== null ? currentIndex + 1 : '–'}/{totalLessons}
            </span>
          </div>

          <div className="outline-list">
            {lessons.map((l, index) => {
              const isCurrent = String(l.id) === String(lesson.id);

              return (
                <Link
                  key={l.id}
                  href={`/courses/${course.id}/${l.id}`}
                  className={'outline-item ' + (isCurrent ? 'outline-item--current' : '')}
                >
                  <div className="outline-number">{index + 1}</div>

                  <div className="outline-label-wrap">
                    <div className="outline-label">{l.title}</div>
                    {isCurrent && <div className="outline-tag">Current</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="lesson-bottom-safe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .lesson-screen {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 12px 16px 24px;
  }

  .lesson-phone {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* HEADER CARD */
  .lesson-header {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: rgba(255,255,255,0.96);
    box-shadow: var(--shadow-brand);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .lesson-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    margin: 0;
    color: #9ca3af;
  }

  .lesson-title {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: #111827;
  }

  .lesson-breadcrumbs {
    margin: 2px 0 0;
    font-size: 12px;
    color: #6b7280;
  }

  .lesson-breadcrumbs a {
    color: var(--ia-green);
    font-weight: 600;
    text-decoration: none;
  }

  .lesson-breadcrumbs a:hover {
    text-decoration: underline;
  }

  .lesson-header-bottom-row {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .lesson-user-pill {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(15, 61, 46, 0.08);
    border: 1px solid rgba(15, 61, 46, 0.12);
    color: #4b5563;
  }

  .lesson-user-pill span {
    font-weight: 700;
  }

  /* COMPLETE BUTTON (neutral / textured when done) */
  .lesson-complete-btn {
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 700;
    background: rgba(255,255,255,0.92);
    color: #111827;
    cursor: pointer;
    box-shadow: var(--shadow-card);
    white-space: nowrap;
  }

  .lesson-complete-btn--done {
    border: 1px solid rgba(255,255,255,0.18);
    color: #ffffff;
    background-image: url('/bg/ia-texture.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    overflow: hidden;
  }

  .lesson-complete-btn--done::after {
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

  .lesson-complete-btn--done {
    position: relative;
  }

  .lesson-complete-btn--done span,
  .lesson-complete-btn--done {
    z-index: 1;
  }

  .lesson-complete-btn[disabled] {
    opacity: 0.7;
    cursor: default;
  }

  /* VIDEO CARD */
  .lesson-video-card {
    border-radius: 20px;
    overflow: hidden;
    background: #000000;
    box-shadow: var(--shadow-brand);
  }

  .lesson-video-card video,
  .lesson-video-card iframe {
    width: 100%;
    display: block;
    border: none;
  }

  .lesson-video-placeholder {
    padding: 24px 18px;
    color: #e5e7eb;
    font-size: 13px;
  }

  /* NOTES CARD */
  .lesson-notes-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: rgba(255,255,255,0.96);
    box-shadow: var(--shadow-brand);
  }

  .lesson-notes-title {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 800;
    color: #111827;
  }

  .lesson-notes-text p {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.55;
    color: #4b5563;
  }

  /* NAV ROW */
  .lesson-nav-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .lesson-nav-link {
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
    text-align: center;
    flex: 0 0 auto;
    box-shadow: var(--shadow-card);
    white-space: nowrap;
  }

  .lesson-nav-link--ghost {
    background: rgba(255,255,255,0.96);
    color: #111827;
    border: 1px solid rgba(15, 23, 42, 0.12);
  }

  /* PRIMARY = textured green */
  .lesson-nav-link--primary {
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.18);
    background-image: url('/bg/ia-texture.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    overflow: hidden;
  }

  .lesson-nav-link--primary::after {
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

  .lesson-nav-link--primary {
    position: relative;
  }
  .lesson-nav-link--primary > * {
    position: relative;
    z-index: 1;
  }

  .lesson-nav-row span {
    flex: 1;
  }

  /* OUTLINE CARD */
  .lesson-outline-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: rgba(255,255,255,0.96);
    box-shadow: var(--shadow-brand);
  }

  .outline-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
  }

  .outline-title {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: #111827;
  }

  .outline-count {
    font-size: 12px;
    color: #9ca3af;
  }

  .outline-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .outline-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 12px;
    text-decoration: none;
    color: #111827;
    background: rgba(15, 61, 46, 0.04);
    border: 1px solid rgba(15, 23, 42, 0.08);
  }

  .outline-item--current {
    background: rgba(15, 61, 46, 0.08);
    border-color: rgba(15, 61, 46, 0.22);
    box-shadow: var(--shadow-card);
  }

  /* gold neutral numbers */
  .outline-number {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    background: rgba(214, 179, 92, 0.22);
    border: 1px solid rgba(214, 179, 92, 0.30);
    color: #6b4f12;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .outline-label-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .outline-label {
    font-size: 13px;
    font-weight: 600;
  }

  .outline-tag {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--ia-green);
    font-weight: 800;
  }

  .lesson-bottom-safe {
    height: 60px;
  }

  @media (max-width: 720px) {
    .lesson-screen {
      padding: 10px 12px 80px;
    }

    .lesson-header-bottom-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .lesson-complete-btn {
      width: 100%;
      text-align: center;
    }

    .lesson-nav-row {
      flex-direction: column;
    }

    .lesson-nav-row span {
      display: none;
    }

    .lesson-nav-link {
      width: 100%;
      justify-content: center;
    }
  }
`;