// pages/dashboard.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from '../hooks/useProfile';
import LayoutShell from '../components/LayoutShell';

export default function DashboardPage() {
  const { profile } = useProfile() || {};

  // 🔗 Replace with your real booking link if needed
  const BOOK_CALL_URL =
    'https://api.leadconnectorhq.com/widget/booking/gBhfSeUYYjXTgOIPNVYt';

  // Courses + progress
  const [courses, setCourses] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [resumeLesson, setResumeLesson] = useState(null);

  // Latest noticeboard post
  const [latestPost, setLatestPost] = useState(null);
  const [latestPostLoading, setLatestPostLoading] = useState(true);

  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────
  // Load courses, lessons & user progress
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function loadDashboardData() {
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

        // 3) All lessons (for counts & ordering)
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

        // Build per-course stats and "next lesson to resume"
        const stats = [];
        let bestResume = null; // { course, lesson, completionRatio }

        (coursesData || []).forEach((course) => {
          const courseLessons =
            (lessonsData || []).filter((l) => l.course_id === course.id) ||
            [];

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
              completedForCourse.map((p) => p.lesson_id),
            );
            const firstIncomplete = courseLessons.find(
              (l) => !completedLessonIds.has(l.id),
            );

            // If everything is complete, "resume" = last lesson
            const candidateLesson = firstIncomplete || courseLessons.at(-1);

            const completionRatio = total === 0 ? 0 : completedCount / total;

            // choose the course with *lowest* completion ratio
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
        console.error('Unexpected dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // ─────────────────────────────────────────────
  // Latest noticeboard post (pinned first)
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function loadLatestPost() {
      try {
        setLatestPostLoading(true);

        const { data, error } = await supabase
          .from('noticeboard_posts')
          .select('id, title, body, is_pinned, created_at')
          .order('is_pinned', { ascending: false }) // pinned first
          .order('created_at', { ascending: false }) // newest first
          .limit(1);

        if (error) {
          console.error('Error loading latest noticeboard post:', error);
          setLatestPost(null);
        } else if (data && data.length > 0) {
          setLatestPost(data[0]);
        } else {
          setLatestPost(null);
        }
      } finally {
        setLatestPostLoading(false);
      }
    }

    loadLatestPost();
  }, []);

  // Convenience: look up stats for a course
  function getStatsForCourse(courseId) {
    return (
      courseStats.find((s) => s.courseId === courseId) || {
        totalLessons: 0,
        completedLessons: 0,
      }
    );
  }

  // Format helpers
  function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString();
  }

  // 🔹 Nice display name: full_name → first_name → username → email prefix → fallback
  const displayName =
    (profile?.full_name && profile.full_name.trim()) ||
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'Investor');

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <LayoutShell>
      <div className="dash-root">
        {/* ───────── Overview Header ───────── */}
        <section className="overview-card">
          <div className="overview-header-row">
            <div className="overview-header-text">
              <div className="overview-kicker">
                IMPERIAL TRAINING • OVERVIEW
              </div>
              <div className="overview-welcome">
                Welcome back, {displayName}{' '}
                <span role="img" aria-label="crown">
                  👑
                </span>
              </div>
            </div>

            <div className="overview-actions">
              <Link href="/profile" className="overview-profile-link">
                Edit profile →
              </Link>
            </div>
          </div>

          <p className="overview-copy">
            Track your progress across all Imperial Advocates training programs
            and continue building your Core Foundations.
          </p>

          <div className="overview-meta-row">
            {/* LATEST NOTICEBOARD UPDATE */}
            <div className="overview-meta-block">
              <div className="overview-meta-label">
                LATEST NOTICEBOARD UPDATE
              </div>
              {latestPostLoading ? (
                <div className="overview-meta-value small">Loading…</div>
              ) : !latestPost ? (
                <div className="overview-meta-value small">
                  No posts yet. Once an admin adds a noticeboard update, it will
                  appear here.
                </div>
              ) : (
                <>
                  <div className="overview-meta-value">
                    {latestPost.title}
                  </div>
                  <div className="overview-meta-sub">
                    {latestPost.is_pinned ? 'Pinned · ' : ''}
                    {formatDate(latestPost.created_at)}
                  </div>
                  {latestPost.body && (
                    <div className="overview-meta-snippet">
                      {latestPost.body.length > 100
                        ? latestPost.body.slice(0, 100) + '…'
                        : latestPost.body}
                    </div>
                  )}
                  <div className="overview-meta-link">
                    <Link href={`/noticeboard/${latestPost.id}`}>
                      View on noticeboard →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* BOOK A CALL */}
            <div className="overview-meta-block">
              <div className="overview-meta-label">BOOK A CALL</div>
              <div className="overview-meta-value">
                Need help with your next investment step?
              </div>
              <div className="overview-meta-sub">
                Choose a time that suits you and speak with our team.
              </div>
              <a
                href={BOOK_CALL_URL}
                target="_blank"
                rel="noreferrer"
                className="overview-book-btn"
              >
                Book a call →
              </a>
            </div>
          </div>
        </section>

        {/* ───────── Continue where you left off ───────── */}
        <section className="resume-card">
          <div className="resume-left">
            <div className="resume-kicker">Continue where you left off</div>
            {resumeLesson ? (
              <>
                <div className="resume-program">
                  {resumeLesson.courseTitle}
                </div>
                <div className="resume-lesson">
                  Lesson – {resumeLesson.lessonTitle}
                </div>
              </>
            ) : (
              <div className="resume-program">
                You haven&apos;t started any lessons yet.
              </div>
            )}
          </div>

          <div className="resume-right">
            {resumeLesson ? (
              <Link
                href={`/courses/${resumeLesson.courseId}/${resumeLesson.lessonId}`}
                className="resume-btn"
              >
                Resume lesson →
              </Link>
            ) : (
              <Link href="/courses" className="resume-btn">
                Browse courses →
              </Link>
            )}
          </div>
        </section>

        {/* ───────── Your courses ───────── */}
        <section className="courses-section">
          <h2 className="section-title">Your courses</h2>

          {loading && courses.length === 0 ? (
            <p className="courses-empty">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="courses-empty">
              No courses available yet. Check back soon.
            </p>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => {
                const stats = getStatsForCourse(course.id);
                const { totalLessons, completedLessons } = stats;
                const pct =
                  totalLessons === 0
                    ? 0
                    : Math.round(
                        (completedLessons / totalLessons) * 100,
                      );

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="course-card"
                  >
                    <div className="course-tag">CORE</div>
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-subtitle">
                      {course.description ||
                        'Training for Imperial Advocates investors.'}
                    </p>

                    <div className="course-progress-row">
                      <span className="course-progress-label">
                        {completedLessons}/{totalLessons} lessons
                      </span>
                      <span className="course-progress-pct">
                        {pct}%
                      </span>
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
      </div>

      <style jsx>{`
        .dash-root {
          max-width: 1040px;
          margin: 0 auto;
          padding: 16px 16px 32px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Overview */
        .overview-card {
          border-radius: 22px;
          padding: 18px 20px;
          background: radial-gradient(
            circle at top left,
            #101a70 0%,
            #060b3e 40%,
            #020316 100%
          );
          box-shadow: 0 22px 55px rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .overview-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .overview-header-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .overview-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.75;
        }

        .overview-welcome {
          font-size: 20px;
          font-weight: 600;
        }

        .overview-actions {
          flex-shrink: 0;
        }

        .overview-profile-link {
          font-size: 12px;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.26);
          background: rgba(2, 4, 32, 0.6);
          color: #fef7dd;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.7);
          transition: background 0.12s ease-out, transform 0.08s ease-out,
            box-shadow 0.12s ease-out, border-color 0.12s ease-out;
        }

        .overview-profile-link:hover {
          background: rgba(2, 4, 40, 0.9);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.9);
        }

        .overview-copy {
          margin: 4px 0 12px;
          font-size: 13px;
          opacity: 0.9;
          max-width: 620px;
        }

        .overview-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .overview-meta-block {
          min-width: 260px;
          max-width: 360px;
        }

        .overview-meta-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .overview-meta-value {
          font-size: 14px;
          font-weight: 500;
        }

        .overview-meta-value.small {
          font-size: 12px;
          opacity: 0.8;
        }

        .overview-meta-sub {
          margin-top: 2px;
          font-size: 11px;
          opacity: 0.75;
        }

        .overview-meta-snippet {
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.85;
        }

        .overview-meta-link {
          margin-top: 4px;
          font-size: 11px;
        }

        .overview-meta-link a {
          color: #f6e7b8;
          text-decoration: none;
        }

        .overview-book-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: linear-gradient(135deg, #d94841, #ff8b5f);
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.9);
          transition: transform 0.08s ease-out, box-shadow 0.12s ease-out;
        }

        .overview-book-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 1);
        }

        /* Resume card */
        .resume-card {
          border-radius: 20px;
          padding: 16px 20px;
          background: linear-gradient(90deg, #d94841, #ff8b5f, #0a147c);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }

        .resume-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .resume-kicker {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          opacity: 0.9;
        }

        .resume-program {
          font-size: 16px;
          font-weight: 600;
        }

        .resume-lesson {
          font-size: 13px;
          opacity: 0.9;
        }

        .resume-right {
          flex-shrink: 0;
        }

        .resume-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(2, 3, 24, 0.96);
          color: #fef7dd;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.85);
          transition: transform 0.08s ease-out, box-shadow 0.08s ease-out;
        }

        .resume-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.95);
        }

        /* Courses */
        .courses-section {
          border-radius: 20px;
          padding: 16px 20px 18px;
          background: rgba(3, 6, 40, 0.98);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .section-title {
          margin: 0 0 10px;
          font-size: 16px;
        }

        .courses-empty {
          margin: 0;
          font-size: 13px;
          opacity: 0.85;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }

        .course-card {
          text-decoration: none;
          color: #ffffff;
          padding: 14px 14px 16px;
          border-radius: 16px;
          background: radial-gradient(
            circle at top left,
            #1d2a8c 0%,
            #050a3a 70%
          );
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 0.08s ease-out, box-shadow 0.12s ease-out;
        }

        .course-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 56px rgba(0, 0, 0, 0.95);
        }

        .course-tag {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.35);
          opacity: 0.9;
          align-self: flex-start;
        }

        .course-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }

        .course-subtitle {
          margin: 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .course-progress-row {
          margin-top: 4px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          opacity: 0.9;
        }

        .course-progress-bar {
          margin-top: 4px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .course-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #f8b45a, #ff8b5f);
        }

        .course-cta {
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.95;
        }

        @media (max-width: 720px) {
          .dash-root {
            padding: 12px 12px 32px;
          }

          .overview-card,
          .resume-card,
          .courses-section {
            padding: 14px 14px 16px;
          }

          .overview-header-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .overview-actions {
            margin-top: 4px;
          }

          .overview-meta-block {
            max-width: 100%;
          }

          .resume-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .resume-right {
            width: 100%;
          }

          .resume-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </LayoutShell>
  );
}