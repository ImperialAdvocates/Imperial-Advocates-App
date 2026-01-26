// pages/admin/strategy.js
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

// Optional helper: make Drive links embeddable for preview in your lesson pages
function getDriveEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('drive.google.com')) return null;
  const match = url.match(/\/d\/([^/]+)/);
  if (!match || !match[1]) return null;
  return `https://drive.google.com/file/d/${match[1]}/preview`;
}

export default function AdminStrategy() {
  const router = useRouter();
  const { loading: profileLoading, isAdmin } = useProfile() || {};

  // Redirect non-admins
  useEffect(() => {
    if (!profileLoading && !isAdmin) router.replace('/dashboard');
  }, [profileLoading, isAdmin, router]);

  // ---------------------------
  // State
  // ---------------------------
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [modulesError, setModulesError] = useState('');

  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const selectedModule = useMemo(() => {
    return modules.find((m) => String(m.id) === String(selectedModuleId)) || null;
  }, [modules, selectedModuleId]);

  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState('');

  // Module form (create/edit)
  const [moduleFormMode, setModuleFormMode] = useState('create'); // 'create' | 'edit'
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleStatus, setModuleStatus] = useState('');

  // Lesson form (create/edit)
  const [lessonFormMode, setLessonFormMode] = useState('create'); // 'create' | 'edit'
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonIndex, setLessonIndex] = useState(1);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonEmbedUrl, setLessonEmbedUrl] = useState('');

  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonStatus, setLessonStatus] = useState('');

  // ---------------------------
  // Load modules
  // ---------------------------
  useEffect(() => {
    if (profileLoading || !isAdmin) return;

    let alive = true;

    async function loadModules() {
      try {
        setModulesError('');
        setModulesLoading(true);

        const { data, error } = await supabase
          .from('strategy_modules')
          .select('id, title, description, created_at')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!alive) return;
        setModules(data || []);

        // auto select first module
        if ((data || []).length > 0 && !selectedModuleId) {
          setSelectedModuleId(data[0].id);
        }
      } catch (e) {
        console.error('Load strategy_modules error:', e);
        if (!alive) return;
        setModules([]);
        setModulesError(e?.message || 'Could not load strategy modules.');
      } finally {
        if (alive) setModulesLoading(false);
      }
    }

    loadModules();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading, isAdmin]);

  // ---------------------------
  // Load lessons for selected module
  // ---------------------------
  useEffect(() => {
    if (profileLoading || !isAdmin) return;
    if (!selectedModuleId) {
      setLessons([]);
      return;
    }

    let alive = true;

    async function loadLessons() {
      try {
        setLessonsError('');
        setLessonsLoading(true);

        const { data, error } = await supabase
          .from('strategy_lessons')
          .select('id, module_id, title, description, video_url, embed_url, lesson_index, created_at')
          .eq('module_id', selectedModuleId)
          .order('lesson_index', { ascending: true });

        if (error) throw error;

        if (!alive) return;
        setLessons(data || []);

        // default next index
        const maxIdx = Math.max(0, ...(data || []).map((l) => Number(l.lesson_index) || 0));
        setLessonIndex(maxIdx + 1);
      } catch (e) {
        console.error('Load strategy_lessons error:', e);
        if (!alive) return;
        setLessons([]);
        setLessonsError(e?.message || 'Could not load lessons.');
      } finally {
        if (alive) setLessonsLoading(false);
      }
    }

    loadLessons();

    return () => {
      alive = false;
    };
  }, [profileLoading, isAdmin, selectedModuleId]);

  // ---------------------------
  // Helpers
  // ---------------------------
  function resetModuleForm() {
    setModuleFormMode('create');
    setModuleTitle('');
    setModuleDescription('');
    setModuleStatus('');
  }

  function startEditModule(mod) {
    setModuleFormMode('edit');
    setModuleTitle(mod?.title || '');
    setModuleDescription(mod?.description || '');
    setModuleStatus('');
  }

  function resetLessonForm(nextIndex = 1) {
    setLessonFormMode('create');
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setLessonVideoUrl('');
    setLessonEmbedUrl('');
    setLessonIndex(nextIndex);
    setLessonStatus('');
  }

  function startEditLesson(lesson) {
    setLessonFormMode('edit');
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title || '');
    setLessonDescription(lesson.description || '');
    setLessonVideoUrl(lesson.video_url || '');
    setLessonEmbedUrl(lesson.embed_url || '');
    setLessonIndex(Number(lesson.lesson_index) || 1);
    setLessonStatus('');
  }

  // ---------------------------
  // Module actions
  // ---------------------------
  async function handleSaveModule(e) {
    e.preventDefault();
    setModuleStatus('');

    const title = (moduleTitle || '').trim();
    if (!title) {
      setModuleStatus('Please enter a module title.');
      return;
    }

    try {
      setModuleSaving(true);

      if (moduleFormMode === 'create') {
        const { data, error } = await supabase
          .from('strategy_modules')
          .insert({
            title,
            description: (moduleDescription || '').trim() || null,
          })
          .select('id, title, description, created_at')
          .single();

        if (error) throw error;

        setModules((prev) => [...prev, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
        setSelectedModuleId(data.id);
        resetModuleForm();
        setModuleStatus('Module created.');
      } else {
        if (!selectedModuleId) {
          setModuleStatus('No module selected.');
          return;
        }

        const { data, error } = await supabase
          .from('strategy_modules')
          .update({
            title,
            description: (moduleDescription || '').trim() || null,
          })
          .eq('id', selectedModuleId)
          .select('id, title, description, created_at')
          .single();

        if (error) throw error;

        setModules((prev) => prev.map((m) => (m.id === data.id ? data : m)));
        setModuleStatus('Module updated.');
      }
    } catch (e2) {
      console.error('Save module error:', e2);
      setModuleStatus(e2?.message || 'Could not save module.');
    } finally {
      setModuleSaving(false);
    }
  }

  async function handleDeleteModule() {
    if (!selectedModuleId) return;
    const ok = window.confirm(
      'Delete this module?\n\nThis will also delete all lessons inside it.'
    );
    if (!ok) return;

    try {
      setModuleSaving(true);
      setModuleStatus('');

      const { error } = await supabase
        .from('strategy_modules')
        .delete()
        .eq('id', selectedModuleId);

      if (error) throw error;

      const nextModules = modules.filter((m) => m.id !== selectedModuleId);
      setModules(nextModules);
      setSelectedModuleId(nextModules[0]?.id || null);
      setLessons([]);
      resetLessonForm(1);
      resetModuleForm();
      setModuleStatus('Module deleted.');
    } catch (e) {
      console.error('Delete module error:', e);
      setModuleStatus(e?.message || 'Could not delete module.');
    } finally {
      setModuleSaving(false);
    }
  }

  // ---------------------------
  // Lesson actions
  // ---------------------------
  async function handleSaveLesson(e) {
    e.preventDefault();
    setLessonStatus('');

    if (!selectedModuleId) {
      setLessonStatus('Select a module first.');
      return;
    }

    const title = (lessonTitle || '').trim();
    if (!title) {
      setLessonStatus('Please enter a lesson title.');
      return;
    }

    const idx = Number(lessonIndex);
    if (!Number.isFinite(idx) || idx < 1) {
      setLessonStatus('Lesson order must be a number (1, 2, 3…).');
      return;
    }

    // Normalise Drive links (optional: you can keep original; your viewer page already handles Drive)
    const vUrl = (lessonVideoUrl || '').trim();
    const eUrl = (lessonEmbedUrl || '').trim();
    const drivePreview = getDriveEmbedUrl(vUrl);
    const video_url = vUrl || null;
    const embed_url = eUrl || (drivePreview ? drivePreview : null);

    try {
      setLessonSaving(true);

      if (lessonFormMode === 'create') {
        const { data, error } = await supabase
          .from('strategy_lessons')
          .insert({
            module_id: selectedModuleId,
            title,
            description: (lessonDescription || '').trim() || null,
            video_url,
            embed_url,
            lesson_index: idx,
          })
          .select('id, module_id, title, description, video_url, embed_url, lesson_index, created_at')
          .single();

        if (error) throw error;

        const next = [...lessons, data].sort((a, b) => (a.lesson_index || 0) - (b.lesson_index || 0));
        setLessons(next);

        const maxIdx = Math.max(0, ...next.map((l) => Number(l.lesson_index) || 0));
        resetLessonForm(maxIdx + 1);
        setLessonStatus('Lesson created.');
      } else {
        if (!editingLessonId) {
          setLessonStatus('No lesson selected.');
          return;
        }

        const { data, error } = await supabase
          .from('strategy_lessons')
          .update({
            title,
            description: (lessonDescription || '').trim() || null,
            video_url,
            embed_url,
            lesson_index: idx,
          })
          .eq('id', editingLessonId)
          .select('id, module_id, title, description, video_url, embed_url, lesson_index, created_at')
          .single();

        if (error) throw error;

        const next = lessons
          .map((l) => (l.id === data.id ? data : l))
          .sort((a, b) => (a.lesson_index || 0) - (b.lesson_index || 0));

        setLessons(next);

        const maxIdx = Math.max(0, ...next.map((l) => Number(l.lesson_index) || 0));
        resetLessonForm(maxIdx + 1);
        setLessonStatus('Lesson updated.');
      }
    } catch (e2) {
      console.error('Save lesson error:', e2);
      setLessonStatus(e2?.message || 'Could not save lesson.');
    } finally {
      setLessonSaving(false);
    }
  }

  async function handleDeleteLesson(lesson) {
    const ok = window.confirm(`Delete lesson "${lesson.title}"?`);
    if (!ok) return;

    try {
      setLessonSaving(true);
      setLessonStatus('');

      const { error } = await supabase
        .from('strategy_lessons')
        .delete()
        .eq('id', lesson.id);

      if (error) throw error;

      const next = lessons.filter((l) => l.id !== lesson.id);
      setLessons(next);

      const maxIdx = Math.max(0, ...next.map((l) => Number(l.lesson_index) || 0));
      resetLessonForm(maxIdx + 1);
      setLessonStatus('Lesson deleted.');
    } catch (e) {
      console.error('Delete lesson error:', e);
      setLessonStatus(e?.message || 'Could not delete lesson.');
    } finally {
      setLessonSaving(false);
    }
  }

  // ---------------------------
  // Render
  // ---------------------------
  if (profileLoading) {
    return (
      <div className="admin-screen">
        <div className="admin-inner">
          <section className="card">
            <p className="eyebrow">ADMIN</p>
            <h1 className="title">Loading…</h1>
            <p className="sub">Checking permissions.</p>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-screen">
      <div className="admin-inner">
        {/* Header */}
        <section className="card">
          <p className="eyebrow">IMPERIAL CONTROL • ADMIN</p>
          <h1 className="title">Strategy manager</h1>
          <p className="sub">
            Create strategy modules and lessons (video + notes) for investors.
          </p>
          <div style={{ marginTop: 10 }}>
            <Link href="/admin" className="link">
              ← Back to admin
            </Link>
          </div>
        </section>

        {/* MODULES */}
        <section className="card">
          <div className="row">
            <h2 className="h2">Modules</h2>
            <span className="pill">
              <span className="dot" />
              {modules.length} module{modules.length === 1 ? '' : 's'}
            </span>
          </div>

          {modulesLoading ? (
            <p className="empty">Loading modules…</p>
          ) : modulesError ? (
            <p className="empty">Could not load modules: {modulesError}</p>
          ) : modules.length === 0 ? (
            <p className="empty">No strategy modules yet.</p>
          ) : (
            <div className="list">
              {modules.map((m) => {
                const active = String(m.id) === String(selectedModuleId);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={active ? 'listItem listItemActive' : 'listItem'}
                    onClick={() => {
                      setSelectedModuleId(m.id);
                      setLessonStatus('');
                      setModuleStatus('');
                      setModuleFormMode('create');
                      setModuleTitle('');
                      setModuleDescription('');
                    }}
                  >
                    <div className="listMain">
                      <div className="listTitle">{m.title}</div>
                      <div className="listSub">
                        {m.description || 'No description'}
                      </div>
                    </div>
                    <span className="chev">{active ? 'Selected' : 'Select'}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="divider" />

          <h3 className="h3">{moduleFormMode === 'edit' ? 'Edit module' : 'Create module'}</h3>

          <form onSubmit={handleSaveModule} className="form">
            <label className="field">
              <span className="label">Title</span>
              <input
                className="input"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="Investor Readiness"
              />
            </label>

            <label className="field">
              <span className="label">Description</span>
              <textarea
                className="textarea"
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                placeholder="Understand borrowing power, structure, and next steps"
              />
            </label>

            <div className="btnRow">
              <button type="submit" className="primary" disabled={moduleSaving}>
                {moduleSaving
                  ? 'Saving…'
                  : moduleFormMode === 'edit'
                  ? 'Save module'
                  : 'Create module'}
              </button>

              {selectedModule && (
                <>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => startEditModule(selectedModule)}
                    disabled={moduleSaving}
                  >
                    Edit selected
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={handleDeleteModule}
                    disabled={moduleSaving}
                  >
                    Delete selected
                  </button>
                </>
              )}

              <button
                type="button"
                className="ghost"
                onClick={() => resetModuleForm()}
                disabled={moduleSaving}
              >
                Clear
              </button>
            </div>

            {moduleStatus ? (
              <p className="status">{moduleStatus}</p>
            ) : null}
          </form>
        </section>

        {/* LESSONS */}
        <section className="card">
          <div className="row">
            <h2 className="h2">Lessons</h2>
            <span className="pill">
              <span className="dot" />
              {lessons.length} lesson{lessons.length === 1 ? '' : 's'}
            </span>
          </div>

          {!selectedModuleId ? (
            <p className="empty">Select a module above to manage lessons.</p>
          ) : lessonsLoading ? (
            <p className="empty">Loading lessons…</p>
          ) : lessonsError ? (
            <p className="empty">Could not load lessons: {lessonsError}</p>
          ) : lessons.length === 0 ? (
            <p className="empty">No lessons yet for this module.</p>
          ) : (
            <div className="list">
              {lessons.map((l) => (
                <div key={l.id} className="lessonRow">
                  <button
                    type="button"
                    className="lessonMain"
                    onClick={() => startEditLesson(l)}
                  >
                    <div className="listMain">
                      <div className="listTitle">
                        {l.lesson_index}. {l.title}
                      </div>
                      <div className="listSub">
                        {(l.description || '').slice(0, 90) || 'No description'}
                      </div>
                    </div>
                    <span className="chev">Edit</span>
                  </button>

                  <button
                    type="button"
                    className="lessonDelete"
                    onClick={() => handleDeleteLesson(l)}
                    disabled={lessonSaving}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="divider" />

          <h3 className="h3">{lessonFormMode === 'edit' ? 'Edit lesson' : 'Create lesson'}</h3>

          <form onSubmit={handleSaveLesson} className="form">
            <div className="twoCol">
              <label className="field">
                <span className="label">Lesson order</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={lessonIndex}
                  onChange={(e) => setLessonIndex(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="label">Title</span>
                <input
                  className="input"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Borrowing Power Basics"
                />
              </label>
            </div>

            <label className="field">
              <span className="label">Description / notes</span>
              <textarea
                className="textarea"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="What to prepare before your next meeting…"
              />
            </label>

            <label className="field">
              <span className="label">Video URL (optional)</span>
              <input
                className="input"
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
                placeholder="Direct mp4 OR Google Drive file link"
              />
              <span className="help">
                If you paste a Google Drive “file/d/…” link, your lesson page can embed it.
              </span>
            </label>

            <label className="field">
              <span className="label">Embed URL (optional)</span>
              <input
                className="input"
                value={lessonEmbedUrl}
                onChange={(e) => setLessonEmbedUrl(e.target.value)}
                placeholder="Any iframe embed URL"
              />
            </label>

            <div className="btnRow">
              <button type="submit" className="primary" disabled={lessonSaving || !selectedModuleId}>
                {lessonSaving
                  ? 'Saving…'
                  : lessonFormMode === 'edit'
                  ? 'Save lesson'
                  : 'Create lesson'}
              </button>

              <button
                type="button"
                className="ghost"
                onClick={() => {
                  const maxIdx = Math.max(0, ...lessons.map((l) => Number(l.lesson_index) || 0));
                  resetLessonForm(maxIdx + 1);
                }}
                disabled={lessonSaving}
              >
                Clear
              </button>
            </div>

            {lessonStatus ? <p className="status">{lessonStatus}</p> : null}
          </form>
        </section>

        <div className="bottomSafe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .admin-screen{
    width:100%;
    display:flex;
    justify-content:center;
    padding:12px 16px 24px;
  }
  .admin-inner{
    width:100%;
    max-width:520px;
    display:flex;
    flex-direction:column;
    gap:16px;
  }

  .card{
    border-radius:20px;
    padding:14px 16px 16px;
    background: rgba(255,255,255,0.96);
    box-shadow: var(--shadow-brand);
    display:flex;
    flex-direction:column;
    gap:10px;
  }

  .eyebrow{
    margin:0;
    font-size:11px;
    text-transform:uppercase;
    letter-spacing:0.18em;
    color:#9ca3af;
  }
  .title{
    margin:0;
    font-size:20px;
    font-weight:900;
    color:#111827;
  }
  .sub{
    margin:0;
    font-size:13px;
    line-height:1.45;
    color:#4b5563;
  }
  .link{
    font-size:12px;
    color:#4f46e5;
    text-decoration:none;
  }
  .link:hover{ text-decoration:underline; }

  .row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
  }
  .h2{
    margin:0;
    font-size:16px;
    font-weight:900;
    color:#111827;
  }
  .h3{
    margin:0;
    font-size:14px;
    font-weight:900;
    color:#111827;
  }

  .pill{
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:4px 10px;
    border-radius:999px;
    background:#eef2ff;
    color:#4b5563;
    font-size:11px;
    font-weight:600;
    white-space:nowrap;
  }
  .dot{
    width:6px;
    height:6px;
    border-radius:999px;
    background:#4f46e5;
  }

  .empty{
    margin:0;
    font-size:13px;
    color:#6b7280;
  }

  .list{
    display:flex;
    flex-direction:column;
    gap:8px;
  }

  .listItem{
    width:100%;
    text-align:left;
    border:none;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    border-radius:16px;
    padding:10px 12px;
    background: linear-gradient(145deg, #ffffff, #eef2ff);
    box-shadow:
      0 14px 36px rgba(15, 23, 42, 0.16),
      0 0 0 1px rgba(209, 213, 219, 0.7);
    color:#0f172a;
  }

  .listItemActive{
    box-shadow:
      0 18px 50px rgba(15, 23, 42, 0.20),
      0 0 0 2px rgba(79, 70, 229, 0.35);
  }

  .listMain{
    display:flex;
    flex-direction:column;
    gap:2px;
    min-width:0;
  }
  .listTitle{
    font-size:14px;
    font-weight:900;
    color:#111827;
    margin:0;
  }
  .listSub{
    font-size:12px;
    color:#6b7280;
    line-height:1.35;
    margin:0;
  }
  .chev{
    font-size:12px;
    font-weight:800;
    color:#4f46e5;
    white-space:nowrap;
  }

  .lessonRow{
    display:flex;
    gap:8px;
    align-items:stretch;
  }
  .lessonMain{
    flex:1;
    border:none;
    background: linear-gradient(145deg, #ffffff, #eef2ff);
    box-shadow:
      0 14px 36px rgba(15, 23, 42, 0.16),
      0 0 0 1px rgba(209, 213, 219, 0.7);
    border-radius:16px;
    padding:10px 12px;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    text-align:left;
    color:#0f172a;
  }
  .lessonDelete{
    width:92px;
    border-radius:16px;
    border:1px solid rgba(185,28,28,0.30);
    background: rgba(185,28,28,0.08);
    color:#991b1b;
    font-weight:800;
    cursor:pointer;
  }
  .lessonDelete:disabled{ opacity:0.7; cursor:default; }

  .divider{
    height:1px;
    background: rgba(15,23,42,0.10);
    margin:2px 0;
  }

  .form{
    display:flex;
    flex-direction:column;
    gap:10px;
  }

  .twoCol{
    display:grid;
    grid-template-columns: 140px 1fr;
    gap:10px;
  }

  .field{
    display:flex;
    flex-direction:column;
    gap:4px;
  }
  .label{
    font-size:11px;
    text-transform:uppercase;
    letter-spacing:0.14em;
    color:#6b7280;
    font-weight:700;
  }
  .help{
    font-size:11px;
    color:#6b7280;
  }

  .input{
    border-radius:14px;
    border:1px solid rgba(15,23,42,0.14);
    background: rgba(255,255,255,0.92);
    padding:10px 12px;
    font-size:14px;
    outline:none;
  }
  .textarea{
    border-radius:14px;
    border:1px solid rgba(15,23,42,0.14);
    background: rgba(255,255,255,0.92);
    padding:10px 12px;
    font-size:14px;
    outline:none;
    min-height:90px;
    resize:vertical;
  }
  .input:focus, .textarea:focus{
    border-color: rgba(79,70,229,0.45);
    box-shadow: 0 0 0 3px rgba(79,70,229,0.10);
    background:#ffffff;
  }

  .btnRow{
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    align-items:center;
  }

  .primary{
    border:none;
    border-radius:999px;
    padding:10px 16px;
    font-size:13px;
    font-weight:900;
    color:#fff;
    cursor:pointer;
    background-image: url('/bg/ia-texture.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    overflow:hidden;
    box-shadow: var(--shadow-brand);
    border: 1px solid rgba(255,255,255,0.14);
  }
  .primary::after{
    content:'';
    position:absolute;
    inset:0;
    background: linear-gradient(135deg, rgba(11,46,35,0.86), rgba(15,61,46,0.70));
    pointer-events:none;
  }
  .primary{ position:relative; }
  .primary > *{ position:relative; z-index:1; }
  .primary:disabled{ opacity:0.7; cursor:default; }

  .ghost{
    border-radius:999px;
    padding:10px 16px;
    font-size:13px;
    font-weight:800;
    background:#fff;
    color:#111827;
    border:1px solid rgba(15,23,42,0.14);
    cursor:pointer;
  }

  .danger{
    border-radius:999px;
    padding:10px 16px;
    font-size:13px;
    font-weight:900;
    border:1px solid rgba(185,28,28,0.30);
    background: rgba(185,28,28,0.08);
    color:#991b1b;
    cursor:pointer;
  }

  .status{
    margin:0;
    font-size:12px;
    color:#374151;
  }

  .bottomSafe{ height:80px; }

  @media (max-width: 720px){
    .admin-screen{ padding:10px 12px 80px; }
    .twoCol{ grid-template-columns: 1fr; }
    .lessonDelete{ width:86px; }
  }
`;