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

  // ─────────────────────────────────────────────
  // Derived stats (with string-safe IDs)
  // ─────────────────────────────────────────────
  const totalLessons = lessons.length;

  // Normalise IDs to strings so number/string differences don't break matching
  const completedLessonIds = new Set(
    (progressRows || []).map((p) => String(p.lesson_id)),
  );

  const completedCount = completedLessonIds.size;
  const completionPct =
    totalLessons === 0
      ? 0
      : Math.round((completedCount / totalLessons) * 100);

  // Helper to check if a given lesson is completed
  const isLessonCompleted = (lessonId) =>
    completedLessonIds.has(String(lessonId));

  // Derive a status label for each lesson
  const getLessonStatusLabel = (lessonId, index) => {
    if (totalLessons === 0) return '';
    if (isLessonCompleted(lessonId)) return 'Completed';

    // "In progress" if any earlier lesson is completed
    const anyEarlierCompleted = lessons
      .slice(0, index)
      .some((l) => completedLessonIds.has(String(l.id)));

    return anyEarlierCompleted ? 'In progress' : 'Not started';
  };

  // ─────────────────────────────────────────────
  // Load course, lessons & progress
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!courseId) return;
    let isMounted = true;

    async function loadCourse() {
      try {
        setLoading(true);

        // 1) Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error getting auth user:', userError);
        }

        // 2) Load course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title, description')
          .eq('id', courseId)
          .single();

        if (courseError) {
          console.error('Error loading course:', courseError);
          if (isMounted) setCourse(null);
          return;
        }

        // 3) Load lessons for this course
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, title, lesson_index')
          .eq('course_id', courseId)
          .order('lesson_index', { ascending: true });

        if (lessonsError) {
          console.error('Error loading lessons:', lessonsError);
        }

        // 4) Load progress for this user in this course
        let courseProgress = [];
        if (user) {
          const { data: progressData, error: progressError } = await supabase
            .from('lesson_progress')
            .select('lesson_id, completed_at')
            .eq('user_id', user.id)
            .eq('course_id', courseId);

          if (progressError) {
            console.error('Error loading lesson progress:', progressError);
          } else {
            courseProgress = progressData || [];
          }
        }

        if (!isMounted) return;

        setCourse(courseData);
        setLessons(lessonsData || []);
        setProgressRows(courseProgress);
      } catch (err) {
        console.error('Unexpected course detail error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const displayName =
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'Investor');

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="course-detail-root">
      {/* If loading or course missing */}
      {loading && !course && (
        <p className="loading-text">Loading course…</p>
      )}

      {!loading && !course && (
        <div className="missing-wrap">
          <h1 className="missing-title">Course not found</h1>
          <p className="missing-text">
            We couldn&apos;t find this training program. It may have been
            removed or you don&apos;t have access.
          </p>
          <Link href="/courses" className="back-link">
            ← Back to all courses
          </Link>
        </div>
      )}

      {course && (
        <>
          {/* HERO / HEADER */}
          <section className="course-hero">
            <div className="hero-left">
              <p className="hero-kicker">IMPERIAL TRAINING • PROGRAM</p>
              <h1 className="hero-title">{course.title}</h1>
              <p className="hero-subtitle">
                {course.description ||
                  'Structured training for Imperial Advocates investors.'}
              </p>

              <div className="hero-breadcrumb">
                <Link href="/courses" className="crumb-link">
                  All courses
                </Link>
                <span className="crumb-separator">/</span>
                <span className="crumb-current">This course</span>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-pill">
                Logged in as <span>{displayName}</span>
              </div>

              <div className="hero-progress-card">
                <div className="hero-progress-row">
                  <span className="hero-progress-value">
                    {completionPct}%
                  </span>
                  <span className="hero-progress-label">
                    course complete
                  </span>
                </div>
                <div className="hero-progress-sub">
                  {completedCount}/{totalLessons || '–'} lessons completed
                </div>
                <div className="hero-progress-bar">
                  <div
                    className="hero-progress-fill"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* PROGRESS CARD */}
          <section className="progress-card">
            <div className="progress-header-row">
              <div>
                <div className="progress-label">PROGRESS</div>
                <div className="progress-count">
                  {completedCount}/{totalLessons} lessons
                </div>
              </div>
              <div className="progress-pct">{completionPct}% complete</div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </section>

          {/* LESSON LIST */}
          <section className="lessons-section">
            <div className="lessons-header-row">
              <h2 className="lessons-title">Lessons</h2>
              <span className="lessons-count">
                {totalLessons} lesson{totalLessons === 1 ? '' : 's'}
              </span>
            </div>

            {totalLessons === 0 ? (
              <p className="lessons-empty">
                This course doesn&apos;t have any lessons yet.
              </p>
            ) : (
              <div className="lessons-list">
                {lessons.map((lesson, idx) => {
                  const completed = isLessonCompleted(lesson.id);
                  const statusLabel = getLessonStatusLabel(
                    lesson.id,
                    idx,
                  );

                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${course.id}/${lesson.id}`}
                      className="lesson-row"
                    >
                      <div className="lesson-left">
                        <div className="lesson-index-wrap">
                          <span className="lesson-index">
                            {idx + 1}
                          </span>
                        </div>

                        <div className="lesson-text">
                          <div className="lesson-title-row">
                            <h3 className="lesson-title">
                              {lesson.title}
                            </h3>
                            <span
                              className={
                                'lesson-status ' +
                                (completed
                                  ? 'completed'
                                  : statusLabel === 'In progress'
                                  ? 'in-progress'
                                  : 'not-started')
                              }
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <p className="lesson-subtext">
                            Tap to open this lesson. Your progress is saved
                            automatically.
                          </p>
                        </div>
                      </div>

                      <div className="lesson-right">
                        <div
                          className={
                            'lesson-check ' +
                            (completed ? 'checked' : 'unchecked')
                          }
                        >
                          {completed ? '✓' : ''}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <style jsx>{`
        .course-detail-root {
          max-width: 1040px;
          margin: 0 auto;
          padding: 16px 16px 32px;
          display: flex;
          flex-direction: column;
          gap: 18px;
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

        /* HERO */
        .course-hero {
          border-radius: 22px;
          padding: 18px 20px 20px;
          background: radial-gradient(
            circle at top left,
            #1a2a8a 0%,
            #060b3e 45%,
            #020316 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 22px 55px rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .hero-left {
          max-width: 600px;
        }

        .hero-kicker {
          margin: 0 0 4px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .hero-title {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 700;
        }

        .hero-subtitle {
          margin: 0 0 10px;
          font-size: 13px;
          opacity: 0.9;
        }

        .hero-breadcrumb {
          display: flex;
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
          opacity: 0.9;
        }

        .hero-right {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
          text-align: right;
          min-width: 200px;
        }

        .hero-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.35);
          opacity: 0.9;
        }

        .hero-pill span {
          font-weight: 600;
          margin-left: 6px;
        }

        .hero-progress-card {
          padding: 8px 10px 10px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.18);
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 200px;
        }

        .hero-progress-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .hero-progress-value {
          font-size: 20px;
          font-weight: 700;
        }

        .hero-progress-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          opacity: 0.85;
        }

        .hero-progress-sub {
          font-size: 11px;
          opacity: 0.9;
        }

        .hero-progress-bar {
          margin-top: 4px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .hero-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #f8b45a, #ff8b5f);
        }

        /* PROGRESS CARD */
        .progress-card {
          border-radius: 20px;
          padding: 14px 18px;
          background: rgba(5, 7, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.9);
        }

        .progress-header-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }

        .progress-label {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .progress-count {
          font-size: 14px;
          font-weight: 500;
        }

        .progress-pct {
          font-size: 12px;
          opacity: 0.8;
        }

        .progress-bar {
          height: 6px;
          margin-top: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #f8b45a, #ff8b5f);
        }

        /* LESSONS */
        .lessons-section {
          border-radius: 20px;
          padding: 16px 20px 18px;
          background: rgba(3, 6, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
        }

        .lessons-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
        }

        .lessons-title {
          margin: 0;
          font-size: 16px;
        }

        .lessons-count {
          font-size: 12px;
          opacity: 0.8;
        }

        .lessons-empty {
          margin: 0;
          font-size: 13px;
          opacity: 0.86;
        }

        .lessons-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lesson-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 10px 10px 12px;
          border-radius: 14px;
          text-decoration: none;
          background: radial-gradient(
            circle at top left,
            rgba(38, 54, 140, 0.8) 0%,
            rgba(4, 7, 40, 0.98) 70%
          );
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          transition: transform 0.08s ease-out, box-shadow 0.12s ease-out,
            border-color 0.12s ease-out;
        }

        .lesson-row:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 38px rgba(0, 0, 0, 0.9);
          border-color: rgba(255, 255, 255, 0.24);
        }

        .lesson-left {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .lesson-index-wrap {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .lesson-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lesson-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lesson-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .lesson-status {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          border: 1px solid transparent;
        }

        .lesson-status.completed {
          border-color: rgba(134, 239, 172, 0.9);
          background: rgba(22, 101, 52, 0.8);
        }

        .lesson-status.in-progress {
          border-color: rgba(248, 180, 90, 0.9);
          background: rgba(133, 77, 14, 0.8);
        }

        .lesson-status.not-started {
          border-color: rgba(148, 163, 184, 0.9);
          background: rgba(15, 23, 42, 0.85);
        }

        .lesson-subtext {
          margin: 0;
          font-size: 11px;
          opacity: 0.85;
        }

        .lesson-right {
          flex-shrink: 0;
        }

        .lesson-check {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .lesson-check.checked {
          background: #22c55e;
          border-color: #22c55e;
          color: #020316;
          font-weight: 700;
        }

        @media (max-width: 720px) {
          .course-detail-root {
            padding: 12px 12px 32px;
          }

          .course-hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-right {
            align-items: flex-start;
            text-align: left;
            min-width: 0;
          }

          .progress-card,
          .lessons-section {
            padding: 14px 14px 16px;
          }

          .lesson-row {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}