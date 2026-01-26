// pages/strategy/[moduleId]/[lessonId].js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useProfile } from '../../../hooks/useProfile';

const BOOK_CALL_URL =
  'https://api.leadconnectorhq.com/widget/booking/gBhfSeUYYjXTgOIPNVYt';

const SHOW_DOC_PREVIEW = true; // set to false if you only want the button link

// Helper: convert Google Drive "file" URL → embeddable preview URL
function getDriveEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('drive.google.com')) return null;

  const match = url.match(/\/d\/([^/]+)/);
  if (!match || !match[1]) return null;

  const fileId = match[1];
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function extractFirstUrl(text) {
  if (!text || typeof text !== 'string') return null;
  const m = text.match(/https?:\/\/[^\s)]+/i);
  return m ? m[0] : null;
}

function LockedStrategy({ styles }) {
  return (
    <div className="slesson-screen">
      <div className="slesson-inner">
        <section className="card" style={{ textAlign: 'center' }}>
          <p className="eyebrow">STRATEGY PREPARATION</p>
          <h1 className="title">Strategy locked</h1>
          <p className="sub" style={{ maxWidth: 360, margin: '0 auto' }}>
            Strategy lessons unlock after an information session with our team.
            This ensures your investment pathway is set up correctly.
          </p>

          <a
            href={BOOK_CALL_URL}
            target="_blank"
            rel="noreferrer"
            className="primaryBtn"
            style={{ marginTop: 16, display: 'inline-flex' }}
          >
            Book an information session →
          </a>
        </section>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

export default function StrategyLessonPage() {
  const router = useRouter();
  const { moduleId, lessonId } = router.query;

  const { profile, loading: profileLoading } = useProfile() || {};
  const role = profile?.role || 'viewer';
  const isInvestor = ['investor', 'admin'].includes(role);

  const [moduleRow, setModuleRow] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Load module + lessons + current lesson (investor/admin only)
  useEffect(() => {
    if (!moduleId || !lessonId || profileLoading || !isInvestor) return;

    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setLoadError('');

        const { data: mod, error: modErr } = await supabase
          .from('strategy_modules')
          .select('id, title, description')
          .eq('id', moduleId)
          .single();

        if (modErr) throw modErr;

        // Try order_index first, fallback to created_at if schema differs
        let rows = [];

        const { data: rowsA, error: rowsErrA } = await supabase
          .from('strategy_lessons')
          .select(
            'id, module_id, title, description, video_url, embed_url, order_index, created_at'
          )
          .eq('module_id', moduleId)
          .order('order_index', { ascending: true });

        if (!rowsErrA) {
          rows = rowsA || [];
        } else {
          const { data: rowsB, error: rowsErrB } = await supabase
            .from('strategy_lessons')
            .select(
              'id, module_id, title, description, video_url, embed_url, created_at'
            )
            .eq('module_id', moduleId)
            .order('created_at', { ascending: true });

          if (rowsErrB) throw rowsErrB;
          rows = rowsB || [];
        }

        const current =
          rows.find((l) => String(l.id) === String(lessonId)) || null;

        if (!alive) return;
        setModuleRow(mod || null);
        setLessons(rows || []);
        setLesson(current);
      } catch (e) {
        console.error('Strategy lesson load error:', e);
        if (!alive) return;
        setModuleRow(null);
        setLessons([]);
        setLesson(null);
        setLoadError(e?.message || 'Could not load this lesson.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => {
      alive = false;
    };
  }, [moduleId, lessonId, profileLoading, isInvestor]);

  const currentIndex = useMemo(() => {
    if (!lessons?.length || !lesson) return null;
    const idx = lessons.findIndex((l) => String(l.id) === String(lesson.id));
    return idx === -1 ? null : idx;
  }, [lessons, lesson]);

  const prevLesson =
    currentIndex !== null && currentIndex > 0 ? lessons[currentIndex - 1] : null;

  const nextLesson =
    currentIndex !== null && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  const lessonNumber =
    currentIndex !== null ? `Lesson ${currentIndex + 1}` : 'Lesson';

  // Video rendering
  const hasDirectVideo =
    !!lesson?.video_url &&
    typeof lesson.video_url === 'string' &&
    !lesson.video_url.includes('drive.google.com');

  const driveEmbedUrl = getDriveEmbedUrl(lesson?.video_url || '');
  const hasDriveVideo = !!driveEmbedUrl;

  // Related doc (pulled from description URL, safest without DB schema changes)
  const possibleDocUrl = extractFirstUrl(lesson?.description || '');
  const docEmbedUrl = getDriveEmbedUrl(possibleDocUrl || '');

  // ✅ Wait for profile
  if (profileLoading) return null;

  // ✅ Viewers see lock screen (NO redirects)
  if (!isInvestor) return <LockedStrategy styles={styles} />;

  if (loading && !lesson) {
    return (
      <div className="slesson-screen">
        <div className="slesson-inner">
          <section className="card">
            <p className="eyebrow">STRATEGY LESSON</p>
            <h1 className="title">Loading lesson…</h1>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!lesson || !moduleRow) {
    return (
      <div className="slesson-screen">
        <div className="slesson-inner">
          <section className="card">
            <p className="eyebrow">STRATEGY LESSON</p>
            <h1 className="title">Lesson not found</h1>
            <p className="sub">
              {loadError || "It may have been removed or you don't have access."}
            </p>
            <div style={{ marginTop: 10 }}>
              <Link href={`/strategy/${moduleId || ''}`} className="link">
                ← Back to module
              </Link>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const totalLessons = lessons.length;

  return (
    <div className="slesson-screen">
      <div className="slesson-inner">
        {/* HEADER */}
        <header className="card">
          <p className="eyebrow">STRATEGY PREPARATION</p>
          <h1 className="title">{lesson.title}</h1>

          <p className="crumbs">
            <Link href="/strategy" className="link">
              All modules
            </Link>{' '}
            ·{' '}
            <Link href={`/strategy/${moduleRow.id}`} className="link">
              {moduleRow.title}
            </Link>{' '}
            · {lessonNumber} of {totalLessons || '—'}
          </p>

          <div className="headerRow">
            <span className="pill">
              <span className="dot" />
              Lesson {currentIndex !== null ? currentIndex + 1 : '—'}
            </span>

            <button type="button" className="ghostBtn">
              Mark lesson complete
            </button>
          </div>
        </header>

        {/* VIDEO */}
        <section className="videoCard">
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
            <div className="videoPlaceholder">
              <p>Lesson video coming soon.</p>
            </div>
          )}
        </section>

        {/* RELATED DOCUMENT (under the video) */}
        {possibleDocUrl && (
          <section className="card">
            <div className="docHeader">
              <h2 className="sectionTitle" style={{ marginBottom: 0 }}>
                Related document
              </h2>

              <a
                href={possibleDocUrl}
                target="_blank"
                rel="noreferrer"
                className="docOpenBtn"
              >
                Open →
              </a>
            </div>

            <p className="docSub">
              This document matches what’s being explained in the lesson.
            </p>

            {SHOW_DOC_PREVIEW && docEmbedUrl && (
              <div className="docFrameWrap">
                <iframe className="docFrame" src={docEmbedUrl} title="Document preview" />
              </div>
            )}
          </section>
        )}

        {/* NOTES */}
        <section className="card">
          <h2 className="sectionTitle">Lesson notes</h2>
          <p className="notesText">
            {lesson.description
              ? lesson.description
              : 'Use this space to take notes while you watch the lesson.'}
          </p>
        </section>

        {/* NAV ROW */}
        <section className="navRow">
          {prevLesson ? (
            <Link
              href={`/strategy/${moduleRow.id}/${prevLesson.id}`}
              className="ghostBtn linkBtn"
            >
              ← Previous lesson
            </Link>
          ) : (
            <span />
          )}

          {nextLesson ? (
            <Link
              href={`/strategy/${moduleRow.id}/${nextLesson.id}`}
              className="primaryBtn linkBtn"
            >
              Next lesson →
            </Link>
          ) : (
            <Link
              href={`/strategy/${moduleRow.id}`}
              className="ghostBtn linkBtn"
            >
              Back to module
            </Link>
          )}
        </section>

        {/* OUTLINE */}
        <section className="card">
          <div className="outlineHeader">
            <h2 className="sectionTitle">Lesson outline</h2>
            <span className="outlineCount">
              {currentIndex !== null ? currentIndex + 1 : '–'}/{totalLessons}
            </span>
          </div>

          <div className="outlineList">
            {lessons.map((l, idx) => {
              const isCurrent = String(l.id) === String(lesson.id);
              return (
                <Link
                  key={l.id}
                  href={`/strategy/${moduleRow.id}/${l.id}`}
                  className={
                    'outlineItem ' + (isCurrent ? 'outlineItemCurrent' : '')
                  }
                >
                  <div className="outlineNum">{idx + 1}</div>
                  <div className="outlineText">
                    <div className="outlineTitle">{l.title}</div>
                    {isCurrent && <div className="outlineTag">CURRENT</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="bottomSafe" />
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  :root{
    --ia-green:#0f3d2e;
    --ia-green-dark:#0b2e23;
    --ia-green-soft: rgba(15,61,46,.10);
    --ia-green-soft-2: rgba(15,61,46,.14);
    --ia-border-soft: rgba(15,23,42,.08);
  }

  .slesson-screen{
    width:100%;
    display:flex;
    justify-content:center;
    padding:12px 16px 24px;
  }
  .slesson-inner{
    width:100%;
    max-width:520px;
    display:flex;
    flex-direction:column;
    gap:16px;
  }

  .card{
    border-radius:22px;
    padding:14px 16px 16px;
    background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,249,.96));
    border: 1px solid var(--ia-border-soft);
    box-shadow: var(--shadow-brand);
  }

  .eyebrow{
    margin:0 0 4px;
    font-size:11px;
    text-transform:uppercase;
    letter-spacing:.18em;
    color:#9ca3af;
  }
  .title{
    margin:0 0 6px;
    font-size:22px;
    font-weight:900;
    color:#111827;
  }
  .sub{
    margin:0;
    font-size:13px;
    line-height:1.45;
    color:#4b5563;
  }

  .crumbs{
    margin:0;
    font-size:12px;
    color:#6b7280;
  }

  .link{
    color: var(--ia-green);
    text-decoration:none;
    font-weight:800;
  }
  .link:hover{ text-decoration:underline; }

  .headerRow{
    margin-top:12px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
  }

  .pill{
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:6px 10px;
    border-radius:999px;
    background: var(--ia-green-soft);
    color: var(--ia-green);
    font-size:11px;
    font-weight:900;
  }
  .dot{
    width:6px;
    height:6px;
    border-radius:999px;
    background: var(--ia-green);
  }

  /* Video */
  .videoCard{
    border-radius:20px;
    overflow:hidden;
    background:#000;
    box-shadow: var(--shadow-brand);
  }
  .videoCard video,
  .videoCard iframe{
    width:100%;
    display:block;
    border:none;
    height: 260px;
  }
  .videoPlaceholder{
    padding:24px 18px;
    color:#e5e7eb;
    font-size:13px;
  }

  .sectionTitle{
    margin:0 0 6px;
    font-size:16px;
    font-weight:900;
    color:#111827;
  }
  .notesText{
    margin:0;
    font-size:13px;
    line-height:1.55;
    color:#4b5563;
  }

  /* Related doc */
  .docHeader{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    margin-bottom: 6px;
  }
  .docSub{
    margin:0 0 10px;
    font-size:13px;
    color:#4b5563;
    line-height:1.45;
  }
  .docOpenBtn{
    border-radius:999px;
    padding:8px 12px;
    font-size:12px;
    font-weight:900;
    text-decoration:none;
    color:#ffffff;

    background-image:url('/bg/ia-texture.png');
    background-size:cover;
    background-position:center;
    background-repeat:no-repeat;
    position:relative;
    overflow:hidden;
    border:1px solid rgba(255,255,255,.14);
    box-shadow: var(--shadow-brand);
  }
  .docOpenBtn::after{
    content:'';
    position:absolute;
    inset:0;
    background: linear-gradient(135deg, rgba(11,46,35,.88), rgba(15,61,46,.72));
    pointer-events:none;
  }
  .docOpenBtn{ position:relative; }
  .docOpenBtn > *{ position:relative; z-index:1; }

  .docFrameWrap{
    border-radius:16px;
    overflow:hidden;
    border: 1px solid rgba(15,23,42,.10);
    background: #fff;
  }
  .docFrame{
    width:100%;
    height:320px;
    border:0;
    display:block;
  }

  /* Buttons */
  .ghostBtn{
    border-radius:999px;
    border:1px solid rgba(15,61,46,.20);
    padding:10px 16px;
    font-size:13px;
    font-weight:900;
    background:#ffffff;
    color:#111827;
    box-shadow: var(--shadow-card);
    cursor:pointer;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;
  }

  .primaryBtn{
    border-radius:999px;
    padding:10px 16px;
    font-size:13px;
    font-weight:900;
    color:#fff;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    justify-content:center;

    background-image:url('/bg/ia-texture.png');
    background-size:cover;
    background-position:center;
    background-repeat:no-repeat;
    position:relative;
    overflow:hidden;
    border:1px solid rgba(255,255,255,.14);
    box-shadow: var(--shadow-brand);
  }
  .primaryBtn::after{
    content:'';
    position:absolute;
    inset:0;
    background: linear-gradient(135deg, rgba(11,46,35,.88), rgba(15,61,46,.72));
    pointer-events:none;
  }
  .primaryBtn{ position:relative; }
  .primaryBtn > *{ position:relative; z-index:1; }

  .linkBtn{
    white-space:nowrap;
  }

  .navRow{
    display:flex;
    justify-content:space-between;
    gap:8px;
    flex-wrap:wrap;
  }
  .navRow span{ flex:1; }

  /* Outline */
  .outlineHeader{
    display:flex;
    justify-content:space-between;
    align-items:baseline;
    margin-bottom:8px;
  }
  .outlineCount{
    font-size:12px;
    color:#9ca3af;
    font-weight:800;
  }

  .outlineList{
    display:flex;
    flex-direction:column;
    gap:8px;
  }

  .outlineItem{
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px 12px;
    border-radius:14px;
    text-decoration:none;
    color:#111827;
    background: linear-gradient(145deg, #ffffff, rgba(15,61,46,.04));
    border:1px solid var(--ia-border-soft);
  }

  .outlineItemCurrent{
    background: var(--ia-green-soft);
    border:1px solid var(--ia-green-soft-2);
  }

  .outlineNum{
    width:34px;
    height:34px;
    border-radius:999px;
    background: rgba(15,61,46,.10);
    color: var(--ia-green);
    font-weight:900;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }

  .outlineText{ display:flex; flex-direction:column; gap:2px; }
  .outlineTitle{ font-weight:900; }
  .outlineTag{
    font-size:10px;
    letter-spacing:.14em;
    text-transform:uppercase;
    font-weight:900;
    color: var(--ia-green);
  }

  .bottomSafe{ height:80px; }

  @media (max-width:720px){
    .slesson-screen{ padding:10px 12px 80px; }
    .navRow{ flex-direction:column; }
    .navRow span{ display:none; }
    .ghostBtn, .primaryBtn{ width:100%; }
    .videoCard iframe, .videoCard video{ height: 220px; }
    .docFrame{ height: 280px; }
  }
`;