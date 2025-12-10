// pages/courses/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function CoursesIndexPage() {
  const { profile } = useProfile() || {};

  const [courses, setCourses] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [resumeLesson, setResumeLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load courses + lessons + progress
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);

        // 1) Auth user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error getting auth user:', userError);
        }

        // 2) All courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, description');

        if (coursesError) {
          console.error('Error loading courses:', coursesError);
          setCourses([]);
          return;
        }

        setCourses(coursesData || []);

        // 3) All lessons (include title + lesson_index so we can resume)
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, course_id, title, lesson_index')
          .order('lesson_index', { ascending: true });

        if (lessonsError) {
          console.error('Error loading lessons:', lessonsError);
        }

        // 4) User lesson progress
        let progressRows = [];
        if (user) {
          const { data: progressData, error: progressError } = await supabase
            .from('lesson_progress')
            .select('lesson_id, course_id, completed_at')
            .eq('user_id', user.id);

          if (progressError) {
            console.error('Error loading lesson progress:', progressError);
          } else {
            progressRows = progressData || [];
          }
        }

        // 5) Build stats per course + find best "resume" lesson
        const stats = [];
        let bestResume = null;

        (coursesData || []).forEach((course) => {
          const courseLessons =
            (lessonsData || []).filter((l) => l.course_id === course.id) || [];
          const total = courseLessons.length;

          const completedForCourse =
            progressRows.filter((p) => p.course_id === course.id) || [];
          const completedCount = completedForCourse.length;

          stats.push({
            courseId: course.id,
            totalLessons: total,
            completedLessons: completedCount,
          });

          if (total > 0) {
            const completedLessonIds = new Set(
              completedForCourse.map((p) => p.lesson_id)
            );

            const firstIncomplete = courseLessons.find(
              (l) => !completedLessonIds.has(l.id)
            );

            const candidateLesson = firstIncomplete || courseLessons.at(-1);
            const completionRatio = total === 0 ? 0 : completedCount / total;

            if (!bestResume || completionRatio < bestResume.completionRatio) {
              bestResume = {
                completionRatio,
                course,
                lesson: candidateLesson,
              };
            }
          }
        });

        setCourseStats(stats);

        if (bestResume && bestResume.course && bestResume.lesson) {
          setResumeLesson({
            courseId: bestResume.course.id,
            courseTitle: bestResume.course.title,
            lessonId: bestResume.lesson.id,
            lessonTitle: bestResume.lesson.title,
          });
        } else {
          setResumeLesson(null);
        }
      } catch (err) {
        console.error('Unexpected courses error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  function getStatsForCourse(courseId) {
    return (
      courseStats.find((s) => s.courseId === courseId) || {
        totalLessons: 0,
        completedLessons: 0,
      }
    );
  }

  const displayName =
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'Investor');

  const totalLabel =
    courses.length === 0
      ? 'No programs yet'
      : courses.length === 1
      ? '1 program'
      : `${courses.length} programs`;

  return (
    <div className="courses-page">
      <div className="courses-inner">
        {/* HERO / HEADER */}
        <header className="courses-hero">
          <div className="hero-top-row">
            <div className="hero-title-block">
              <p className="hero-eyebrow">TRAINING</p>
              <h1 className="hero-title">Courses</h1>
              <p className="hero-sub">
                {displayName
                  ? `Keep building your knowledge, ${displayName}.`
                  : 'Keep building your knowledge.'}{' '}
                Work through each module at your own pace and come back any
                time.
              </p>
            </div>

            <div className="hero-meta">
              <div className="hero-pill">
                <span className="hero-pill-dot" />
                <span>{totalLabel}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTINUE LEARNING – same vibe as dashboard */}
        {resumeLesson && (
          <section className="courses-continue">
            <div className="continue-card">
              <div>
                <p className="continue-kicker">Continue learning</p>
                <p className="continue-title">{resumeLesson.courseTitle}</p>
                <p className="continue-sub">
                  Lesson – {resumeLesson.lessonTitle}
                </p>
              </div>
              <Link
                href={`/courses/${resumeLesson.courseId}/${resumeLesson.lessonId}`}
                className="continue-btn"
              >
                Resume →
              </Link>
            </div>
          </section>
        )}

        {/* BODY: course list */}
        <section className="courses-section">
          <div className="courses-header-row">
            <h2 className="section-heading">Your learning</h2>
          </div>

          {loading && courses.length === 0 ? (
            <p className="courses-empty">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="courses-empty">
              No courses are available yet. Once your first program is published,
              it will appear here.
            </p>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => {
                const stats = getStatsForCourse(course.id);
                const { totalLessons, completedLessons } = stats;
                const pct =
                  totalLessons === 0
                    ? 0
                    : Math.round((completedLessons / totalLessons) * 100);

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="course-card"
                  >
                    <div className="course-card-top">
                      <div className="course-icon">
                        <span className="course-icon-glyph">📘</span>
                      </div>
                      <div className="course-text">
                        <h3 className="course-title">{course.title}</h3>
                        <p className="course-subtitle">
                          {course.description ||
                            'Training designed for Imperial Advocates investors.'}
                        </p>
                      </div>
                    </div>

                    <div className="course-meta-row">
                      <span className="course-lessons">
                        {completedLessons}/{totalLessons} lessons
                      </span>
                      <span className="course-pct">{pct}%</span>
                    </div>

                    <div className="course-progress-bar">
                      <div
                        className="course-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="course-cta">Open course →</div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* space so bottom nav doesn’t cover content on mobile */}
        <div className="courses-bottom-safe" />
      </div>

      <style jsx>{`
        /* Match dashboard + noticeboard shell */
        .courses-page {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .courses-inner {
          width: 100%;
          max-width: 520px; /* same as dash-inner */
          padding: 12px 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* HERO CARD */
        .courses-hero {
          border-radius: 20px;
          padding: 14px 14px 16px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
        }

        .hero-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .hero-title-block {
          max-width: 560px;
        }

        .hero-eyebrow {
          margin: 0 0 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #9ca3af;
        }

        .hero-title {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
        }

        .hero-sub {
          margin: 0;
          font-size: 13px;
          line-height: 1.45;
          color: #4b5563;
        }

        .hero-meta {
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4b5563;
          font-size: 11px;
          font-weight: 500;
        }

        .hero-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #4f46e5;
        }

        /* CONTINUE CARD (blue gradient, like dashboard’s updated one) */
        .courses-continue {
          margin-top: 0;
        }

        .continue-card {
          padding: 16px 18px;
          border-radius: 26px;
          background: linear-gradient(135deg, #1d2cff, #0a0f4f);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
          position: relative;
          overflow: hidden;
        }

        .continue-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at top left,
            rgba(255, 255, 255, 0.18),
            transparent 60%
          );
          pointer-events: none;
        }

        .continue-card > div {
          position: relative;
          z-index: 1;
        }

        .continue-kicker {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .continue-title {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 2px;
        }

        .continue-sub {
          font-size: 13px;
          opacity: 0.95;
          margin: 0;
        }

        .continue-btn {
          position: relative;
          z-index: 1;
          border-radius: 999px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.18);
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          backdrop-filter: blur(8px);
          white-space: nowrap;
        }

        /* COURSES SECTION CARD */
        .courses-section {
          border-radius: 22px;
          padding: 14px 14px 16px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 20px 55px rgba(15, 23, 42, 0.22);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .courses-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .section-heading {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .courses-empty {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        /* GRID + CARDS */
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .course-card {
          text-decoration: none;
          padding: 12px 12px 14px;
          border-radius: 18px;
          background: linear-gradient(145deg, #ffffff, #eef2ff);
          box-shadow:
            0 14px 36px rgba(15, 23, 42, 0.2),
            0 0 0 1px rgba(209, 213, 219, 0.7);
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #0f172a;
          transition: transform 0.08s ease-out, box-shadow 0.12s ease-out;
        }

        .course-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 18px 50px rgba(15, 23, 42, 0.28),
            0 0 0 1px rgba(129, 140, 248, 0.9);
        }

        .course-card-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .course-icon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: radial-gradient(circle at top left, #e0e7ff, #1d2cff);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .course-icon-glyph {
          font-size: 20px;
        }

        .course-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .course-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .course-subtitle {
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
          color: #6b7280;
        }

        .course-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 11px;
          color: #6b7280;
        }

        .course-pct {
          font-weight: 600;
          color: #4f46e5;
        }

        .course-progress-bar {
          margin-top: 2px;
          height: 6px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .course-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
        }

        .course-cta {
          margin-top: 6px;
          font-size: 11px;
          font-weight: 500;
          color: #4b5563;
        }

        .courses-bottom-safe {
          height: 72px;
        }

        @media (max-width: 720px) {
          .courses-inner {
            padding: 10px 12px 12px;
          }

          .hero-top-row {
            flex-direction: column;
          }

          .hero-meta {
            justify-content: flex-start;
          }

          .courses-grid {
            grid-template-columns: 1fr;
          }

          .courses-bottom-safe {
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
}