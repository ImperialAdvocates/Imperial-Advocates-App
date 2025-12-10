// pages/admin/courses.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function AdminCoursesPage() {
  const router = useRouter();
  const { profile, isAdmin, loading: profileLoading } = useProfile();

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [expandedCourseId, setExpandedCourseId] = useState(null);

  // Lessons state
  const [lessonsByCourse, setLessonsByCourse] = useState({}); // courseId -> lesson[]
  const [lessonsLoading, setLessonsLoading] = useState({}); // courseId -> bool
  const [lessonForm, setLessonForm] = useState({}); // courseId -> { title, video_url, notes }

  // Course editing
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseEditForm, setCourseEditForm] = useState({}); // courseId -> { title, description }
  const [savingCourseId, setSavingCourseId] = useState(null);

  // Reorder loading
  const [reorderLoading, setReorderLoading] = useState({}); // courseId -> bool

  // Lesson editing
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonEditForm, setLessonEditForm] = useState({}); // lessonId -> { title, video_url, notes }
  const [savingLessonId, setSavingLessonId] = useState(null);

  // ─────────────────────────────────────────────
  // Guard: only admins
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (profileLoading) return;
    if (profile && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [profile, isAdmin, profileLoading, router]);

  // ─────────────────────────────────────────────
  // Load courses
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);

        const { data, error } = await supabase
          .from('courses')
          .select('id, title, description')
          .order('title', { ascending: true });

        if (error) {
          console.error('Error loading courses in admin panel:', error);
          alert('Could not load courses. Check console for details.');
          setCourses([]);
          return;
        }

        setCourses(data || []);
      } catch (err) {
        console.error('Unexpected admin courses error:', err);
        alert('Unexpected error loading courses. Check console.');
      } finally {
        setLoadingCourses(false);
      }
    }

    if (!profileLoading && isAdmin) {
      loadCourses();
    }
  }, [profileLoading, isAdmin]);

  // ─────────────────────────────────────────────
  // Create course
  // ─────────────────────────────────────────────
  async function handleCreateCourse(e) {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter a course title.');
      return;
    }

    try {
      setCreating(true);

      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            title: newTitle.trim(),
            description: newDescription.trim() || null,
          },
        ])
        .select('id, title, description')
        .single();

      if (error) {
        console.error('Error creating course:', error);
        alert('Could not create course. Check console for details.');
        return;
      }

      setCourses((prev) => [data, ...prev]);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      console.error('Unexpected error creating course:', err);
      alert('Unexpected error creating course. Check console.');
    } finally {
      setCreating(false);
    }
  }

  // ─────────────────────────────────────────────
  // Delete course
  // ─────────────────────────────────────────────
  async function handleDeleteCourse(courseId) {
    if (!window.confirm('Delete this course and all its lessons?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        console.error('Error deleting course:', error);
        alert('Could not delete course. Check console.');
        return;
      }

      setCourses((prev) => prev.filter((c) => c.id !== courseId));

      setLessonsByCourse((prev) => {
        const copy = { ...prev };
        delete copy[courseId];
        return copy;
      });
    } catch (err) {
      console.error('Unexpected error deleting course:', err);
      alert('Unexpected error deleting course. Check console.');
    }
  }

  // ─────────────────────────────────────────────
  // Edit course
  // ─────────────────────────────────────────────
  function startEditCourse(course) {
    setEditingCourseId(course.id);
    setCourseEditForm((prev) => ({
      ...prev,
      [course.id]: {
        title: course.title || '',
        description: course.description || '',
      },
    }));
  }

  function updateCourseEditForm(courseId, field, value) {
    setCourseEditForm((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || { title: '', description: '' }),
        [field]: value,
      },
    }));
  }

  async function handleSaveCourse(courseId) {
    const form = courseEditForm[courseId];
    if (!form || !form.title.trim()) {
      alert('Please enter a course title.');
      return;
    }

    try {
      setSavingCourseId(courseId);

      const { data, error } = await supabase
        .from('courses')
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
        })
        .eq('id', courseId)
        .select('id, title, description')
        .single();

      if (error) {
        console.error('Error updating course:', error);
        alert('Could not update course. Check console.');
        return;
      }

      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? data : c))
      );

      setEditingCourseId(null);
    } catch (err) {
      console.error('Unexpected error updating course:', err);
      alert('Unexpected error updating course. Check console.');
    } finally {
      setSavingCourseId(null);
    }
  }

  function handleCancelEditCourse(courseId) {
    setEditingCourseId(null);
    setCourseEditForm((prev) => {
      const copy = { ...prev };
      delete copy[courseId];
      return copy;
    });
  }

  // ─────────────────────────────────────────────
  // Load lessons for course
  // ─────────────────────────────────────────────
  async function loadLessonsForCourse(courseId) {
    try {
      setLessonsLoading((prev) => ({ ...prev, [courseId]: true }));

      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, video_url, lesson_index, notes')
        .eq('course_id', courseId)
        .order('lesson_index', { ascending: true });

      if (error) {
        console.error('Error loading lessons:', error);
        alert('Could not load lessons for this course. Check console.');
        return;
      }

      setLessonsByCourse((prev) => ({ ...prev, [courseId]: data || [] }));

      setLessonForm((prev) => ({
        ...prev,
        [courseId]:
          prev[courseId] || { title: '', video_url: '', notes: '' },
      }));
    } catch (err) {
      console.error('Unexpected error loading lessons:', err);
      alert('Unexpected error loading lessons. Check console.');
    } finally {
      setLessonsLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  }

  function toggleManageLessons(courseId) {
    const isCurrentlyExpanded = expandedCourseId === courseId;
    const newId = isCurrentlyExpanded ? null : courseId;
    setExpandedCourseId(newId);

    if (!isCurrentlyExpanded && !lessonsByCourse[courseId]) {
      loadLessonsForCourse(courseId);
    }
  }

  // ─────────────────────────────────────────────
  // Create lesson
  // ─────────────────────────────────────────────
  async function handleCreateLesson(courseId) {
    const form = lessonForm[courseId] || {
      title: '',
      video_url: '',
      notes: '',
    };

    if (!form.title.trim()) {
      alert('Please enter a lesson title.');
      return;
    }

    const existingLessons = lessonsByCourse[courseId] || [];
    const nextIndex =
      existingLessons.length === 0
        ? 1
        : Math.max(...existingLessons.map((l) => l.lesson_index || 0)) + 1;

    try {
      setLessonsLoading((prev) => ({ ...prev, [courseId]: true }));

      const { data, error } = await supabase
        .from('lessons')
        .insert([
          {
            course_id: courseId,
            title: form.title.trim(),
            video_url: form.video_url.trim() || null,
            notes: form.notes.trim() || null,
            lesson_index: nextIndex,
          },
        ])
        .select('id, title, video_url, lesson_index, notes')
        .single();

      if (error) {
        console.error('Error creating lesson:', error);
        alert('Could not create lesson. Check console for details.');
        return;
      }

      setLessonsByCourse((prev) => ({
        ...prev,
        [courseId]: [...(prev[courseId] || []), data],
      }));

      setLessonForm((prev) => ({
        ...prev,
        [courseId]: { title: '', video_url: '', notes: '' },
      }));
    } catch (err) {
      console.error('Unexpected error creating lesson:', err);
      alert('Unexpected error creating lesson. Check console.');
    } finally {
      setLessonsLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  }

  // ─────────────────────────────────────────────
  // Delete lesson
  // ─────────────────────────────────────────────
  async function handleDeleteLesson(courseId, lessonId) {
    if (!window.confirm('Delete this lesson?')) return;

    try {
      const { error: progressError } = await supabase
        .from('lesson_progress')
        .delete()
        .eq('lesson_id', lessonId);

      if (progressError) {
        console.error('Error deleting lesson progress:', progressError);
      }

      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) {
        console.error('Error deleting lesson:', error);
        alert('Could not delete lesson. Check console.');
        return;
      }

      setLessonsByCourse((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).filter(
          (l) => l.id !== lessonId
        ),
      }));
    } catch (err) {
      console.error('Unexpected error deleting lesson:', err);
      alert('Unexpected error deleting lesson. Check console.');
    }
  }

  // ─────────────────────────────────────────────
  // Reorder lesson
  // ─────────────────────────────────────────────
  async function handleMoveLesson(courseId, lessonId, direction) {
    const list = lessonsByCourse[courseId] || [];
    if (list.length < 2) return;

    const currentIndex = list.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= list.length) return;

    const currentLesson = list[currentIndex];
    const targetLesson = list[targetIndex];

    try {
      setReorderLoading((prev) => ({ ...prev, [courseId]: true }));

      const tempIndex = -1;

      let { error: tempError } = await supabase
        .from('lessons')
        .update({ lesson_index: tempIndex })
        .eq('id', currentLesson.id);

      if (tempError) {
        console.error('Error setting temp index:', tempError);
        alert('Could not reorder lesson. Check console.');
        return;
      }

      let { error: targetError } = await supabase
        .from('lessons')
        .update({ lesson_index: currentLesson.lesson_index })
        .eq('id', targetLesson.id);

      if (targetError) {
        console.error('Error updating target lesson index:', targetError);
        alert('Could not reorder lesson. Check console.');
        return;
      }

      let { error: currentError } = await supabase
        .from('lessons')
        .update({ lesson_index: targetLesson.lesson_index })
        .eq('id', currentLesson.id);

      if (currentError) {
        console.error('Error updating current lesson index:', currentError);
        alert('Could not reorder lesson. Check console.');
        return;
      }

      const newList = [...list];
      [newList[currentIndex], newList[targetIndex]] = [
        newList[targetIndex],
        newList[currentIndex],
      ];

      setLessonsByCourse((prev) => ({
        ...prev,
        [courseId]: newList,
      }));
    } catch (err) {
      console.error('Unexpected error reordering lesson:', err);
      alert('Unexpected error reordering lesson. Check console.');
    } finally {
      setReorderLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  }

  // ─────────────────────────────────────────────
  // Lesson editing
  // ─────────────────────────────────────────────
  function startEditLesson(lesson) {
    setEditingLessonId(lesson.id);
    setLessonEditForm((prev) => ({
      ...prev,
      [lesson.id]: {
        title: lesson.title || '',
        video_url: lesson.video_url || '',
        notes: lesson.notes || '',
      },
    }));
  }

  function updateLessonEditForm(lessonId, field, value) {
    setLessonEditForm((prev) => ({
      ...prev,
      [lessonId]: {
        ...(prev[lessonId] || { title: '', video_url: '', notes: '' }),
        [field]: value,
      },
    }));
  }

  async function handleSaveLesson(courseId, lessonId) {
    const form = lessonEditForm[lessonId];
    if (!form || !form.title.trim()) {
      alert('Please enter a lesson title.');
      return;
    }

    try {
      setSavingLessonId(lessonId);

      const { data, error } = await supabase
        .from('lessons')
        .update({
          title: form.title.trim(),
          video_url: form.video_url.trim() || null,
          notes: form.notes.trim() || null,
        })
        .eq('id', lessonId)
        .select('id, title, video_url, lesson_index, course_id, notes')
        .single();

      if (error) {
        console.error('Error updating lesson:', error);
        alert('Could not update lesson. Check console.');
        return;
      }

      setLessonsByCourse((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).map((l) =>
          l.id === lessonId ? data : l
        ),
      }));

      setEditingLessonId(null);
      setLessonEditForm((prev) => {
        const copy = { ...prev };
        delete copy[lessonId];
        return copy;
      });
    } catch (err) {
      console.error('Unexpected error updating lesson:', err);
      alert('Unexpected error updating lesson. Check console.');
    } finally {
      setSavingLessonId(null);
    }
  }

  function handleCancelEditLesson(lessonId) {
    setEditingLessonId(null);
    setLessonEditForm((prev) => {
      const copy = { ...prev };
      delete copy[lessonId];
      return copy;
    });
  }

  // ─────────────────────────────────────────────
  // Lesson create form helper
  // ─────────────────────────────────────────────
  function updateLessonForm(courseId, field, value) {
    setLessonForm((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || {
          title: '',
          video_url: '',
          notes: '',
        }),
        [field]: value,
      },
    }));
  }

  const displayName =
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'admin');

  // ─────────────────────────────────────────────
  // RENDER – shell + content
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
            <Link href="/dashboard" className="admin-link">
              ← Back to dashboard
            </Link>
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
          <p className="admin-eyebrow">ADMIN • COURSES</p>
          <h1 className="admin-title">Courses &amp; lessons</h1>
          <p className="admin-sub">
            Create, edit and organise training programs. Changes here update
            what investors see in their portal.
          </p>
          <p className="admin-sub small">
            Logged in as <strong>{displayName}</strong>.{' '}
            <Link href="/admin" className="admin-link-inline">
              ← Back to admin home
            </Link>
          </p>
        </section>

        {/* ADD COURSE */}
        <section className="admin-card">
          <h2 className="admin-card-title">Add new course</h2>

          <form onSubmit={handleCreateCourse} className="form-vertical">
            <label className="field-label">Course title</label>
            <input
              className="field-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Core Foundations"
            />

            <label className="field-label">
              Description <span className="muted">(optional)</span>
            </label>
            <textarea
              className="field-textarea"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Short description for this course…"
              rows={3}
            />

            <button
              type="submit"
              className="primary-btn full"
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create course'}
            </button>
          </form>
        </section>

        {/* COURSES LIST */}
        <section className="admin-card">
          <h2 className="admin-card-title">Your courses</h2>

          {loadingCourses ? (
            <p className="muted">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="muted">
              No courses yet — add your first one above.
            </p>
          ) : (
            <div className="courses-list">
              {courses.map((course) => {
                const lessons = lessonsByCourse[course.id] || [];
                const isExpanded = expandedCourseId === course.id;
                const courseLessonsLoading =
                  lessonsLoading[course.id] || false;
                const isEditingCourse = editingCourseId === course.id;
                const editForm =
                  courseEditForm[course.id] || {
                    title: course.title || '',
                    description: course.description || '',
                  };
                const isSavingThisCourse = savingCourseId === course.id;
                const isReordering = reorderLoading[course.id] || false;

                const createForm = lessonForm[course.id] || {
                  title: '',
                  video_url: '',
                  notes: '',
                };

                return (
                  <div key={course.id} className="course-card">
                    <div className="course-header">
                      <div>
                        <div className="course-tag">COURSE</div>

                        {isEditingCourse ? (
                          <>
                            <input
                              className="field-input"
                              value={editForm.title}
                              onChange={(e) =>
                                updateCourseEditForm(
                                  course.id,
                                  'title',
                                  e.target.value
                                )
                              }
                              placeholder="Course title"
                            />
                            <textarea
                              className="field-textarea"
                              value={editForm.description}
                              onChange={(e) =>
                                updateCourseEditForm(
                                  course.id,
                                  'description',
                                  e.target.value
                                )
                              }
                              placeholder="Short description…"
                              rows={2}
                              style={{ marginTop: 6 }}
                            />
                          </>
                        ) : (
                          <>
                            <h3 className="course-title">{course.title}</h3>
                            {course.description && (
                              <p className="course-description">
                                {course.description}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="course-actions">
                        {isEditingCourse ? (
                          <>
                            <button
                              type="button"
                              className="ghost-btn small"
                              onClick={() => handleSaveCourse(course.id)}
                              disabled={isSavingThisCourse}
                            >
                              {isSavingThisCourse ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="ghost-btn small danger-text"
                              onClick={() =>
                                handleCancelEditCourse(course.id)
                              }
                              disabled={isSavingThisCourse}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="ghost-btn small"
                              onClick={() => startEditCourse(course)}
                            >
                              Edit course
                            </button>
                            <Link
                              href={`/courses/${course.id}`}
                              className="ghost-btn small"
                            >
                              View as investor
                            </Link>
                            <button
                              type="button"
                              className="ghost-btn small danger-text"
                              onClick={() =>
                                handleDeleteCourse(course.id)
                              }
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* LESSON MANAGEMENT TOGGLE */}
                    <div className="course-lessons-row">
                      <button
                        type="button"
                        className="ghost-btn xsmall"
                        onClick={() => toggleManageLessons(course.id)}
                      >
                        {isExpanded ? 'Hide lessons' : 'Manage lessons'}
                      </button>
                    </div>

                    {/* LESSONS PANEL */}
                    {isExpanded && (
                      <div className="lessons-panel">
                        <h4 className="lessons-heading">Lessons</h4>

                        {courseLessonsLoading ? (
                          <p className="muted">Loading lessons…</p>
                        ) : lessons.length === 0 ? (
                          <p className="muted">
                            No lessons yet — add the first one below.
                          </p>
                        ) : (
                          <ul className="lessons-list">
                            {lessons.map((lesson, index) => {
                              const isEditingLesson =
                                editingLessonId === lesson.id;
                              const editLessonForm =
                                lessonEditForm[lesson.id] || {
                                  title: lesson.title || '',
                                  video_url: lesson.video_url || '',
                                  notes: lesson.notes || '',
                                };
                              const isSavingThisLesson =
                                savingLessonId === lesson.id;

                              return (
                                <li key={lesson.id} className="lesson-item">
                                  <div>
                                    {isEditingLesson ? (
                                      <>
                                        <div className="lesson-title-row">
                                          <span className="lesson-index">
                                            {lesson.lesson_index || '-'}
                                          </span>
                                          <input
                                            className="field-input"
                                            value={editLessonForm.title}
                                            onChange={(e) =>
                                              updateLessonEditForm(
                                                lesson.id,
                                                'title',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Lesson title"
                                          />
                                        </div>
                                        <div className="lesson-sub">
                                          <span className="lesson-sub-label">
                                            Video URL
                                          </span>
                                          <input
                                            className="field-input"
                                            value={editLessonForm.video_url}
                                            onChange={(e) =>
                                              updateLessonEditForm(
                                                lesson.id,
                                                'video_url',
                                                e.target.value
                                              )
                                            }
                                            placeholder="https://…"
                                            style={{ marginTop: 4 }}
                                          />
                                        </div>
                                        <div className="lesson-sub">
                                          <span className="lesson-sub-label">
                                            Notes / resources
                                          </span>
                                          <textarea
                                            className="field-textarea"
                                            rows={3}
                                            value={editLessonForm.notes}
                                            onChange={(e) =>
                                              updateLessonEditForm(
                                                lesson.id,
                                                'notes',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Bullet points, key takeaways, links…"
                                            style={{ marginTop: 4 }}
                                          />
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="lesson-title-row">
                                          <span className="lesson-index">
                                            {lesson.lesson_index || '-'}
                                          </span>
                                          <span className="lesson-title">
                                            {lesson.title}
                                          </span>
                                        </div>
                                        {lesson.video_url && (
                                          <div className="lesson-sub">
                                            <span className="lesson-sub-label">
                                              Video URL
                                            </span>
                                            <div className="muted">
                                              {lesson.video_url}
                                            </div>
                                          </div>
                                        )}
                                        {lesson.notes && (
                                          <div className="lesson-sub">
                                            <span className="lesson-sub-label">
                                              Notes
                                            </span>
                                            <div className="muted">
                                              {lesson.notes.length > 120
                                                ? lesson.notes.slice(
                                                    0,
                                                    120
                                                  ) + '…'
                                                : lesson.notes}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  <div className="lesson-actions">
                                    {isEditingLesson ? (
                                      <>
                                        <button
                                          type="button"
                                          className="ghost-btn xsmall"
                                          onClick={() =>
                                            handleSaveLesson(
                                              course.id,
                                              lesson.id
                                            )
                                          }
                                          disabled={isSavingThisLesson}
                                        >
                                          {isSavingThisLesson
                                            ? 'Saving…'
                                            : 'Save'}
                                        </button>
                                        <button
                                          type="button"
                                          className="ghost-btn xsmall danger-text"
                                          onClick={() =>
                                            handleCancelEditLesson(
                                              lesson.id
                                            )
                                          }
                                          disabled={isSavingThisLesson}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="ghost-btn xsmall"
                                          onClick={() =>
                                            handleMoveLesson(
                                              course.id,
                                              lesson.id,
                                              'up'
                                            )
                                          }
                                          disabled={
                                            isReordering || index === 0
                                          }
                                        >
                                          ↑
                                        </button>
                                        <button
                                          type="button"
                                          className="ghost-btn xsmall"
                                          onClick={() =>
                                            handleMoveLesson(
                                              course.id,
                                              lesson.id,
                                              'down'
                                            )
                                          }
                                          disabled={
                                            isReordering ||
                                            index === lessons.length - 1
                                          }
                                        >
                                          ↓
                                        </button>
                                        <button
                                          type="button"
                                          className="ghost-btn xsmall"
                                          onClick={() =>
                                            startEditLesson(lesson)
                                          }
                                          disabled={isReordering}
                                        >
                                          Edit
                                        </button>
                                        <Link
                                          href={`/courses/${course.id}/${lesson.id}`}
                                          className="ghost-btn xsmall"
                                        >
                                          Open
                                        </Link>
                                        <button
                                          type="button"
                                          className="ghost-btn xsmall danger-text"
                                          onClick={() =>
                                            handleDeleteLesson(
                                              course.id,
                                              lesson.id
                                            )
                                          }
                                          disabled={isReordering}
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        {/* ADD LESSON */}
                        <div className="add-lesson-card">
                          <h5 className="lessons-subheading">
                            Add new lesson
                          </h5>
                          <div className="form-vertical">
                            <label className="field-label">Title</label>
                            <input
                              className="field-input"
                              value={createForm.title}
                              onChange={(e) =>
                                updateLessonForm(
                                  course.id,
                                  'title',
                                  e.target.value
                                )
                              }
                              placeholder="Lesson title"
                            />

                            <label className="field-label">
                              Video URL{' '}
                              <span className="muted">(optional)</span>
                            </label>
                            <input
                              className="field-input"
                              value={createForm.video_url}
                              onChange={(e) =>
                                updateLessonForm(
                                  course.id,
                                  'video_url',
                                  e.target.value
                                )
                              }
                              placeholder="https://…"
                            />

                            <label className="field-label">
                              Notes / resources{' '}
                              <span className="muted">(optional)</span>
                            </label>
                            <textarea
                              className="field-textarea"
                              rows={3}
                              value={createForm.notes}
                              onChange={(e) =>
                                updateLessonForm(
                                  course.id,
                                  'notes',
                                  e.target.value
                                )
                              }
                              placeholder="Key points, links, exercise notes…"
                            />

                            <button
                              type="button"
                              className="primary-btn"
                              disabled={courseLessonsLoading}
                              onClick={() => handleCreateLesson(course.id)}
                            >
                              {courseLessonsLoading
                                ? 'Saving…'
                                : 'Add lesson'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
  /* Shell – light, matches dashboard */
  .admin-screen {
    width: 100%;
    display: flex;
    justify-content: center;
    background: #f5f7fb;
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
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
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

  .admin-link,
  .admin-link-inline {
    font-size: 12px;
    color: #555fe0;
    text-decoration: none;
  }

  .admin-link:hover,
  .admin-link-inline:hover {
    text-decoration: underline;
  }

  /* MAIN CARDS */
  .admin-card {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: #ffffff;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
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

  /* FORM BASICS */
  .form-vertical {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #6b7280;
  }

  .muted {
    opacity: 0.75;
    font-size: 12px;
    color: #6b7280;
  }

  .field-input,
  .field-textarea {
    width: 100%;
    border-radius: 10px;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    padding: 8px 10px;
    font-size: 13px;
    color: #111827;
    outline: none;
  }

  .field-textarea {
    resize: vertical;
  }

  .field-input:focus,
  .field-textarea:focus {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.14);
  }

  .primary-btn {
    border: none;
    border-radius: 999px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
    color: #ffffff;
    box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
    white-space: nowrap;
  }

  .primary-btn[disabled] {
    opacity: 0.85;
    cursor: default;
    box-shadow: none;
  }

  .full {
    width: 100%;
    margin-top: 4px;
  }

  /* COURSES LIST */
  .courses-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .course-card {
    border-radius: 16px;
    padding: 12px 12px 14px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .course-header {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .course-tag {
    display: inline-flex;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    background: #e5e7eb;
    color: #4b5563;
    margin-bottom: 4px;
  }

  .course-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .course-description {
    margin: 3px 0 0;
    font-size: 13px;
    color: #4b5563;
  }

  .course-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .ghost-btn {
    border-radius: 999px;
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #111827;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }

  .ghost-btn.small {
    padding: 5px 9px;
    font-size: 12px;
  }

  .ghost-btn.xsmall {
    padding: 4px 7px;
    font-size: 11px;
  }

  .ghost-btn.danger-text,
  .danger-text {
    color: #b91c1c;
    border-color: #fecaca;
  }

  .ghost-btn:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .course-lessons-row {
    margin-top: 8px;
    display: flex;
    justify-content: flex-start;
  }

  /* LESSONS PANEL */
  .lessons-panel {
    margin-top: 6px;
    border-radius: 14px;
    padding: 10px 10px 12px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
  }

  .lessons-heading {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .lessons-subheading {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }

  .lessons-list {
    list-style: none;
    padding: 0;
    margin: 4px 0 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lesson-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 9px;
    border-radius: 10px;
    background: #f3f4f6;
  }

  .lesson-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .lesson-index {
    display: inline-flex;
    width: 18px;
    height: 18px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #e5e7eb;
    font-size: 11px;
    color: #4b5563;
  }

  .lesson-title {
    font-size: 13px;
    font-weight: 500;
    color: #111827;
  }

  .lesson-sub {
    margin-top: 4px;
    font-size: 11px;
    color: #4b5563;
  }

  .lesson-sub-label {
    display: inline-block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #6b7280;
    margin-bottom: 1px;
  }

  .lesson-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-end;
  }

  .add-lesson-card {
    margin-top: 8px;
    border-radius: 12px;
    padding: 9px 10px 11px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .admin-bottom-safe {
    height: 60px;
  }

  @media (max-width: 720px) {
    .admin-screen {
      padding: 10px 12px 80px;
    }

    .admin-card {
      padding: 12px 12px 14px;
    }

    .course-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .course-actions {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }

    .lesson-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .lesson-actions {
      justify-content: flex-start;
    }

    .admin-bottom-safe {
      height: 80px;
    }
  }
`;