// pages/courses/[courseId]/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useProfile } from '../../../hooks/useProfile';

export default function CourseDetailPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { profile } = useProfile() || {};

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progressRows, setProgressRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setLoadError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) console.error('Error getting auth user:', userError);

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title, description')
          .eq('id', courseId)
          .single();

        if (courseError) {
          console.error('Error loading course:', courseError);
          if (isMounted) {
            setCourse(null);
            setLoadError('Could not load course.');
          }
          return;
        }

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, title, lesson_index')
          .eq('course_id', courseId)
          .order('lesson_index', { ascending: true });

        if (lessonsError) console.error('Error loading lessons:', lessonsError);

        let userProgress = [];
        if (user) {
          const { data: progressData, error: progressError } = await supabase
            .from('lesson_progress')
            .select('lesson_id, completed_at')
            .eq('user_id', user.id)
            .eq('course_id', courseId);

          if (progressError) {
            console.error('Error loading lesson progress:', progressError);
          } else {
            userProgress = progressData || [];
          }
        }

        if (!isMounted) return;

        setCourse(courseData || null);
        setLessons(lessonsData || []);
        setProgressRows(userProgress);
      } catch (err) {
        console.error('Unexpected course detail error:', err);
        if (isMounted) setLoadError('Unexpected error loading course.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const totalLessons = lessons.length;

  const completedLessonIds = new Set(
    (progressRows || []).map((p) => String(p.lesson_id))
  );

  const completedCount = completedLessonIds.size;
  const completionPct =
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const isLessonCompleted = (lessonId) => completedLessonIds.has(String(lessonId));

  const getLessonStatusLabel = (lessonId, index) => {
    if (totalLessons === 0) return '';
    if (isLessonCompleted(lessonId)) return 'Completed';

    const anyEarlierCompleted = lessons
      .slice(0, index)
      .some((l) => completedLessonIds.has(String(l.id)));

    return anyEarlierCompleted ? 'In progress' : 'Not started';
  };

  let nextLesson = null;
  if (lessons.length > 0) {
    const firstIncomplete = lessons.find((l) => !completedLessonIds.has(String(l.id)));
    nextLesson = firstIncomplete || lessons[lessons.length - 1];
  }

  const displayName =
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'Investor');

  if (loading && !course) {
    return (
      <div className="course-screen">
        <div className="course-phone">
          <header className="course-header">
            <p className="course-eyebrow">COURSE</p>
            <h1 className="course-title">Loading course…</h1>
          </header>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-screen">
        <div className="course-phone">
          <header className="course-header">
            <p className="course-eyebrow">COURSE</p>
            <h1 className="course-title">Course not found</h1>
            <p className="course-sub">
              It may have been removed or you don&apos;t have access.
            </p>
          </header>

          <section className="course-card">
            <Link href="/courses" className="course-back-link">
              ← Back to all courses
            </Link>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="course-screen">
      <div className="course-phone">
        {/* HEADER CARD */}
        <header className="course-header">
          <p className="course-eyebrow">TRAINING PROGRAM</p>
          <h1 className="course-title">{course.title}</h1>
          <p className="course-sub">
            {course.description || 'Structured training for Imperial Advocates investors.'}
          </p>

          <div className="course-header-row">
            <div className="course-chip-row">
              <div className="course-chip">
                <span className="course-chip-dot" />
                <span>
                  {totalLessons === 0
                    ? 'No lessons yet'
                    : `${totalLessons} lesson${totalLessons === 1 ? '' : 's'}`}
                </span>
              </div>

              <div className="course-chip">
                Progress: {completedCount}/{totalLessons || 0} · {completionPct}%
              </div>
            </div>

            <div className="course-user-pill">
              Logged in as <span>{displayName}</span>
            </div>
          </div>
        </header>

        {/* NEXT UP (TEXTURED ACCENT) */}
        {nextLesson && (
          <section className="course-continue-card">
            <div className="course-continue-left">
              <p className="course-continue-eyebrow">Next up</p>
              <p className="course-continue-title">{nextLesson.title}</p>
              <p className="course-continue-sub">
                Tap below to jump into the next lesson.
              </p>
            </div>

            <Link
              href={`/courses/${course.id}/${nextLesson.id}`}
              className="course-continue-btn"
            >
              Open lesson →
            </Link>
          </section>
        )}

        {/* LESSON LIST */}
        <section className="course-card">
          <div className="course-list-header">
            <h2 className="course-list-title">Lesson outline</h2>
            <Link href="/courses" className="course-back-link">
              All courses →
            </Link>
          </div>

          {loadError ? (
            <p className="course-empty">{loadError}</p>
          ) : totalLessons === 0 ? (
            <p className="course-empty">No lessons have been added to this course yet.</p>
          ) : (
            <div className="course-lessons-list">
              {lessons.map((lesson, index) => {
                const completed = isLessonCompleted(lesson.id);
                const statusLabel = getLessonStatusLabel(lesson.id, index);
                const isNext = nextLesson && nextLesson.id === lesson.id && !completed;

                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/${course.id}/${lesson.id}`}
                    className={
                      'course-lesson-item' +
                      (completed ? ' course-lesson-item--done' : '') +
                      (isNext ? ' course-lesson-item--next' : '')
                    }
                  >
                    <div className="course-lesson-left">
                      <div className="course-lesson-number">{index + 1}</div>

                      <div className="course-lesson-text">
                        <p className="course-lesson-title">{lesson.title}</p>
                        <p className="course-lesson-sub">
                          Tap to open this lesson. Your progress is saved automatically.
                        </p>
                      </div>
                    </div>

                    <div className="course-lesson-right">
                      <span
                        className={
                          'course-status-pill ' +
                          (completed
                            ? 'course-status-pill--done'
                            : statusLabel === 'In progress'
                            ? 'course-status-pill--progress'
                            : 'course-status-pill--notstarted')
                        }
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <div className="course-bottom-safe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .course-screen {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 12px 16px 24px;
  }

  .course-phone {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* HEADER CARD */
  .course-header {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: rgba(255,255,255,0.96);
    box-shadow: var(--shadow-brand);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .course-eyebrow {
    margin: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #9ca3af;
  }

  .course-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }

  .course-sub {
    margin: 2px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  .course-header-row {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .course-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .course-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(15, 61, 46, 0.08);
    border: 1px solid rgba(15, 61, 46, 0.12);
    font-size: 11px;
    color: #4b5563;
    font-weight: 500;
  }

  .course-chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--ia-green);
  }

  .course-user-pill {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(15, 23, 42, 0.08);
    color: #4b5563;
  }

  .course-user-pill span {
    font-weight: 600;
  }

  /* GENERIC CARD */
  .course-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: rgba(255,255,255,0.96);
    box-shadow: var(--shadow-brand);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* NEXT UP – TEXTURED ACCENT CARD */
  .course-continue-card {
    border-radius: 22px;
    padding: 14px 16px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    box-shadow: var(--shadow-brand);
    position: relative;
    overflow: hidden;

    background-image: url('/bg/ia-texture.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .course-continue-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(11, 46, 35, 0.82),
      rgba(15, 61, 46, 0.66)
    );
    pointer-events: none;
  }

  .course-continue-left,
  .course-continue-btn {
    position: relative;
    z-index: 1;
  }

  .course-continue-eyebrow {
    margin: 0 0 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    opacity: 0.92;
    color: rgba(255,255,255,0.92);
  }

  .course-continue-title {
    margin: 0 0 2px;
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
  }

  .course-continue-sub {
    margin: 0;
    font-size: 12px;
    opacity: 0.95;
    color: rgba(255,255,255,0.92);
  }

  .course-continue-btn {
    border-radius: 999px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: #ffffff;
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
    backdrop-filter: blur(8px);
    white-space: nowrap;
  }

  /* LIST HEADER */
  .course-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .course-list-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .course-back-link {
    font-size: 12px;
    color: var(--ia-green);
    text-decoration: none;
    font-weight: 600;
  }

  .course-back-link:hover {
    text-decoration: underline;
  }

  .course-empty {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  /* LESSON ITEMS */
  .course-lessons-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .course-lesson-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    border-radius: 16px;
    padding: 10px 12px;

    background: linear-gradient(145deg, #ffffff, rgba(15, 61, 46, 0.04));
    box-shadow:
      0 14px 36px rgba(15, 23, 42, 0.12),
      0 0 0 1px rgba(15, 23, 42, 0.08);

    text-decoration: none;
    color: #0f172a;
    transition: transform 0.08s ease-out, box-shadow 0.12s ease-out;
  }

  .course-lesson-item:hover {
    transform: translateY(-1px);
    box-shadow:
      0 18px 50px rgba(15, 23, 42, 0.18),
      0 0 0 1px rgba(15, 61, 46, 0.28);
  }

  .course-lesson-item--done {
    opacity: 0.95;
  }

  .course-lesson-item--next {
    box-shadow:
      0 18px 50px rgba(15, 61, 46, 0.18),
      0 0 0 1px rgba(15, 61, 46, 0.55);
  }

  .course-lesson-left {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  /* lesson number: green/gold neutral, not red */
  .course-lesson-number {
    width: 32px;
    height: 32px;
    border-radius: 12px;
    background: rgba(214, 179, 92, 0.22);
    border: 1px solid rgba(214, 179, 92, 0.30);
    color: #6b4f12;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .course-lesson-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .course-lesson-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #111827;
  }

  .course-lesson-sub {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }

  .course-lesson-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  /* STATUS PILLS – green system */
  .course-status-pill {
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    border: 1px solid transparent;
  }

  .course-status-pill--notstarted {
    background: rgba(15, 61, 46, 0.08);
    color: var(--ia-green);
    border-color: rgba(15, 61, 46, 0.14);
  }

  .course-status-pill--done {
    background: rgba(34, 197, 94, 0.14);
    color: #15803d;
    border-color: rgba(34, 197, 94, 0.22);
  }

  .course-status-pill--progress {
    background: rgba(214, 179, 92, 0.18);
    color: #8a6a16;
    border-color: rgba(214, 179, 92, 0.28);
  }

  .course-bottom-safe {
    height: 60px;
  }

  @media (max-width: 720px) {
    .course-screen {
      padding: 10px 12px 80px;
    }

    .course-header-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .course-continue-card {
      flex-direction: column;
      align-items: flex-start;
    }

    .course-continue-btn {
      width: 100%;
      text-align: center;
    }

    .course-lesson-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .course-lesson-right {
      align-items: flex-start;
    }

    .course-bottom-safe {
      height: 80px;
    }
  }
`;