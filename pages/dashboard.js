// pages/dashboard.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from '../hooks/useProfile';

export default function DashboardPage() {
  const { profile } = useProfile() || {};

  const BOOK_CALL_URL =
    'https://api.leadconnectorhq.com/widget/booking/gBhfSeUYYjXTgOIPNVYt';

  const [courses, setCourses] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [resumeLesson, setResumeLesson] = useState(null);

  const [latestPost, setLatestPost] = useState(null);
  const [latestPostLoading, setLatestPostLoading] = useState(true);

  const [loading, setLoading] = useState(true);

  // Load courses, lessons & user progress
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error getting auth user:', userError);
        }

        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, description');

        if (coursesError) {
          console.error('Error loading courses:', coursesError);
          setCourses([]);
          return;
        }

        setCourses(coursesData || []);

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, course_id, title, lesson_index')
          .order('lesson_index', { ascending: true });

        if (lessonsError) {
          console.error('Error loading lessons:', lessonsError);
        }

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
        console.error('Unexpected dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Latest noticeboard post
  useEffect(() => {
    async function loadLatestPost() {
      try {
        setLatestPostLoading(true);

        const { data, error } = await supabase
          .from('noticeboard_posts')
          .select('id, title, body, is_pinned, created_at')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
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

  function getStatsForCourse(courseId) {
    return (
      courseStats.find((s) => s.courseId === courseId) || {
        totalLessons: 0,
        completedLessons: 0,
      }
    );
  }

  function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString();
  }

  const displayName =
    (profile?.full_name && profile.full_name.trim()) ||
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'Investor');

  const displayInitial =
    displayName && displayName.trim()
      ? displayName.trim()[0].toUpperCase()
      : 'I';

  return (
    <div className="dash-page">
      <div className="dash-inner">
        {/* HEADER */}
        <header className="dash-header">
          <div>
            <p className="dash-label">Investor training</p>
            <h1 className="dash-title">Welcome back, {displayName}</h1>
            <p className="dash-subtitle">Let&apos;s continue where you left off.</p>
          </div>

          <div className="dash-avatar">
            <span>{displayInitial}</span>
          </div>
        </header>

        {/* NOTICEBOARD + BOOK CALL ROW */}
        <section className="dash-section dash-row-two">
          <div className="dash-card dash-notice-card">
            <p className="dash-card-kicker">Latest noticeboard update</p>

            {latestPostLoading ? (
              <p className="dash-card-body small">Loading…</p>
            ) : !latestPost ? (
              <p className="dash-card-body small">
                No posts yet. Once an admin adds an update, it will appear here.
              </p>
            ) : (
              <>
                <p className="dash-card-title">{latestPost.title}</p>
                <p className="dash-card-meta">
                  {latestPost.is_pinned ? 'Pinned · ' : ''}
                  {formatDate(latestPost.created_at)}
                </p>
                {latestPost.body && (
                  <p className="dash-card-body">
                    {latestPost.body.length > 80
                      ? latestPost.body.slice(0, 80) + '…'
                      : latestPost.body}
                  </p>
                )}
                <Link
                  href={`/noticeboard/${latestPost.id}`}
                  className="dash-card-link"
                >
                  View on noticeboard →
                </Link>
              </>
            )}
          </div>

          <div className="dash-card dash-call-card">
            <p className="dash-card-kicker">Book a call</p>
            <p className="dash-card-title">Need help with your next step?</p>
            <p className="dash-card-body">
              Choose a time that suits you and speak with our team.
            </p>
            <a
              href={BOOK_CALL_URL}
              target="_blank"
              rel="noreferrer"
              className="dash-primary-btn"
            >
              Book a call
            </a>
          </div>
        </section>

        {/* CONTINUE LEARNING */}
        <section className="dash-section">
          <div className="dash-continue-card">
            <div>
              <p className="dash-continue-kicker">Continue learning</p>
              {resumeLesson ? (
                <>
                  <p className="dash-continue-title">
                    {resumeLesson.courseTitle}
                  </p>
                  <p className="dash-continue-sub">
                    Lesson – {resumeLesson.lessonTitle}
                  </p>
                </>
              ) : (
                <>
                  <p className="dash-continue-title">
                    You haven&apos;t started any lessons yet.
                  </p>
                  <p className="dash-continue-sub">
                    Open a course below to get started.
                  </p>
                </>
              )}
            </div>

            {resumeLesson ? (
              <Link
                href={`/courses/${resumeLesson.courseId}/${resumeLesson.lessonId}`}
                className="dash-continue-btn"
              >
                Resume →
              </Link>
            ) : (
              <Link href="/courses" className="dash-continue-btn">
                Browse →
              </Link>
            )}
          </div>
        </section>

        {/* YOUR COURSES */}
        <section className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Your courses</h2>
          </div>

          {loading && courses.length === 0 ? (
            <p className="dash-empty-text">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="dash-empty-text">
              No courses available yet. Check back soon.
            </p>
          ) : (
            <div className="dash-course-grid">
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
                    className="dash-course-card"
                  >
                    <p className="dash-course-title">{course.title}</p>
                    <p className="dash-course-subtitle">
                      {course.description ||
                        'Training for Imperial Advocates investors.'}
                    </p>

                    <div className="dash-course-progress-row">
                      <span className="dash-course-progress-label">
                        {completedLessons}/{totalLessons} lessons
                      </span>
                      <span className="dash-course-progress-pct">
                        {pct}%
                      </span>
                    </div>

                    <div className="dash-course-bar">
                      <div
                        className="dash-course-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .dash-page {
          display: flex;
          justify-content: center;
        }

        .dash-inner {
          width: 100%;
          max-width: 520px;
          padding: 12px 16px 0; /* ⬅ no extra bottom padding */
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .dash-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #a1a6c0;
          margin-bottom: 4px;
        }

        .dash-title {
          font-size: 22px;
          font-weight: 700;
          color: #151827;
          margin: 0 0 4px;
        }

        .dash-subtitle {
          margin: 0;
          font-size: 13px;
          color: #9fa4bd;
        }

        .dash-avatar {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #151827;
        }

        .dash-section {
          margin-bottom: 16px;
        }

        /* ⬅ kill extra gap under the LAST section */
        .dash-section:last-of-type {
          margin-bottom: 0;
        }

        .dash-row-two {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 12px;
        }

        .dash-card {
          background: #ffffff;
          border-radius: 22px;
          padding: 14px 14px 16px;
          box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
        }

        .dash-card-kicker {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #b0b4c8;
          margin-bottom: 4px;
        }

        .dash-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #181a2c;
          margin: 0 0 4px;
        }

        .dash-card-meta {
          font-size: 11px;
          color: #a1a6c0;
          margin: 0 0 4px;
        }

        .dash-card-body {
          font-size: 12px;
          color: #8c90a8;
          margin: 0;
        }

        .dash-card-body.small {
          font-size: 12px;
        }

        .dash-card-link {
          display: inline-block;
          margin-top: 6px;
          font-size: 12px;
          color: #555fe0;
          text-decoration: none;
        }

        .dash-card-link:hover {
          text-decoration: underline;
        }

        .dash-call-card {
          text-align: left;
        }

        .dash-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
        }

        /* Continue card */

        .dash-continue-card {
          padding: 16px 18px;
          border-radius: 26px;
          background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
        }

        .dash-continue-kicker {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .dash-continue-title {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 2px;
        }

        .dash-continue-sub {
          font-size: 13px;
          opacity: 0.95;
          margin: 0;
        }

        .dash-continue-btn {
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

        /* Courses */

        .dash-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .dash-section-title {
          font-size: 17px;
          font-weight: 600;
          margin: 0;
          color: #181a2c;
        }

        .dash-empty-text {
          margin: 4px 0 0;
          font-size: 13px;
          color: #9fa4bd;
        }

        .dash-course-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .dash-course-card {
          text-decoration: none;
          background: #ffffff;
          border-radius: 20px;
          padding: 12px 12px 14px;
          box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dash-course-title {
          font-size: 14px;
          font-weight: 600;
          color: #181a2c;
          margin: 0;
        }

        .dash-course-subtitle {
          font-size: 12px;
          color: #9fa4bd;
          margin: 0 0 6px;
        }

        .dash-course-progress-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #a1a6c0;
          margin-bottom: 4px;
        }

        .dash-course-bar {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: #eef0fb;
          overflow: hidden;
        }

        .dash-course-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
        }

        @media (max-width: 720px) {
          .dash-inner {
            padding: 10px 12px 0; /* ⬅ no bottom padding on mobile either */
          }

          .dash-row-two {
            grid-template-columns: 1fr;
          }

          .dash-continue-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .dash-course-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}