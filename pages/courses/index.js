// pages/courses/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function CoursesIndexPage() {
  const { profile } = useProfile() || {};

  const [courses, setCourses] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
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

        // 3) All lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, course_id')
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

        // 5) Build stats per course
        const stats = [];

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
        });

        setCourseStats(stats);
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

  return (
    <div className="courses-root">
      {/* HERO HEADER */}
      <header className="courses-hero">
        <div className="hero-left">
          <div className="hero-kicker">TRAINING • YOUR LIBRARY</div>
          <h1 className="hero-title">Courses & Programs</h1>
          <p className="hero-sub">
            {displayName
              ? `Keep building your knowledge, ${displayName}.`
              : 'Keep building your knowledge.'}{' '}
            Work through each module at your own pace and come back any time.
          </p>
        </div>
      </header>

      {/* COURSE GRID */}
      <section className="courses-section">
        <div className="courses-header-row">
          <h2 className="section-title">All courses</h2>
          {/* (optional filters can go here later) */}
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
                  <div className="course-tag">CORE</div>
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-subtitle">
                    {course.description ||
                      'Training designed for Imperial Advocates investors.'}
                  </p>

                  <div className="course-progress-row">
                    <span className="course-progress-label">
                      {completedLessons}/{totalLessons} lessons
                    </span>
                    <span className="course-progress-pct">{pct}%</span>
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

      <style jsx>{`
        .courses-root {
          max-width: 1040px;
          margin: 0 auto;
          padding: 16px 16px 80px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .courses-hero {
  border-radius: 22px;
  padding: 18px 20px 20px;

  /* IA Master Gradient */
  background: linear-gradient(90deg, #f4a261, #e76f51, #1b1f6b);

  box-shadow: 0 22px 55px rgba(0,0,0,0.85);
  overflow: hidden;
}

        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hero-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .hero-title {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
        }

        .hero-sub {
          margin: 4px 0 0;
          font-size: 13px;
          opacity: 0.9;
          max-width: 600px;
        }

        .courses-section {
          border-radius: 20px;
          padding: 16px 20px 18px;
          background: rgba(3, 6, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
        }

        .courses-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .section-title {
          margin: 0;
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
          .courses-root {
            padding-bottom: 110px; /* room for bottom nav */
          }

          .courses-hero,
          .courses-section {
            padding: 14px 14px 16px;
          }
        }
      `}</style>
    </div>
  );
}