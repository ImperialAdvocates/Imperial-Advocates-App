// pages/strategy/[moduleId]/index.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useProfile } from '../../../hooks/useProfile';

const BOOK_CALL_URL =
  'https://api.leadconnectorhq.com/widget/booking/gBhfSeUYYjXTgOIPNVYt';

function LockedStrategy({ styles }) {
  return (
    <div className="mod-screen">
      <div className="mod-inner">
        <section className="card card--hero" style={{ textAlign: 'center' }}>
          <p className="eyebrow">STRATEGY PREPARATION</p>
          <h1 className="title">Strategy locked</h1>
          <p className="sub" style={{ maxWidth: 360, margin: '0 auto' }}>
            Strategy Preparation unlocks after an information session with our
            team. This ensures your strategy is structured correctly before you
            proceed.
          </p>

          <a
            href={BOOK_CALL_URL}
            target="_blank"
            rel="noreferrer"
            className="nextBtn"
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

export default function StrategyModulePage() {
  const router = useRouter();
  const { moduleId } = router.query;

  const { profile, loading: profileLoading, isAdmin } = useProfile() || {};
  const role = profile?.role || 'viewer';
  const isInvestor = useMemo(() => ['investor', 'admin'].includes(role), [role]);

  const [moduleRow, setModuleRow] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!moduleId || profileLoading || !isInvestor) return;

    let alive = true;

    async function load() {
      try {
        setError('');
        setLoadingData(true);

        const { data: mod, error: modErr } = await supabase
          .from('strategy_modules')
          .select('id, title, description')
          .eq('id', moduleId)
          .single();

        if (modErr) throw modErr;

        // Try order_index first, fallback to created_at
        let finalLessons = [];

        const { data: rowsA, error: rowsErrA } = await supabase
          .from('strategy_lessons')
          .select('id, module_id, title, description, order_index, created_at')
          .eq('module_id', moduleId)
          .order('order_index', { ascending: true });

        if (!rowsErrA) {
          finalLessons = rowsA || [];
        } else {
          const { data: rowsB, error: rowsErrB } = await supabase
            .from('strategy_lessons')
            .select('id, module_id, title, description, created_at')
            .eq('module_id', moduleId)
            .order('created_at', { ascending: true });

          if (rowsErrB) throw rowsErrB;
          finalLessons = rowsB || [];
        }

        if (!alive) return;
        setModuleRow(mod || null);
        setLessons(finalLessons || []);
      } catch (e) {
        console.error('Strategy module load error:', e);
        if (!alive) return;
        setError(e?.message || 'Could not load this module.');
        setModuleRow(null);
        setLessons([]);
      } finally {
        if (alive) setLoadingData(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [moduleId, profileLoading, isInvestor]);

  const displayName =
    (profile?.first_name && profile.first_name.trim()) ||
    (profile?.username && profile.username.trim()) ||
    (profile?.email ? profile.email.split('@')[0] : 'Investor');

  // Wait for profile
  if (profileLoading) return null;

  // Viewers see lock screen (NO redirects)
  if (!isInvestor) return <LockedStrategy styles={styles} />;

  if (loadingData && !moduleRow) {
    return (
      <div className="mod-screen">
        <div className="mod-inner">
          <section className="card card--hero">
            <p className="eyebrow">STRATEGY MODULE</p>
            <h1 className="title">Loading module…</h1>
            <p className="sub">Please wait.</p>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!moduleRow) {
    return (
      <div className="mod-screen">
        <div className="mod-inner">
          <section className="card card--hero">
            <p className="eyebrow">STRATEGY MODULE</p>
            <h1 className="title">Module not found</h1>
            <p className="sub">{error || 'It may have been removed.'}</p>
            <div style={{ marginTop: 10 }}>
              <Link href="/strategy" className="link">
                ← Back to modules
              </Link>
            </div>
          </section>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const totalLessons = lessons.length;
  const nextLesson = lessons[0] || null;

  return (
    <div className="mod-screen">
      <div className="mod-inner">
        {/* HEADER */}
        <section className="card card--hero">
          <div className="hero-left">
            <p className="eyebrow">STRATEGY MODULE</p>
            <h1 className="title">{moduleRow.title}</h1>
            <p className="sub">{moduleRow.description || ''}</p>

            <div className="heroRow">
              <div className="chips">
                <div className="pill">
                  <span className="dot" />
                  <span>
                    {totalLessons === 0
                      ? 'No lessons yet'
                      : `${totalLessons} lesson${totalLessons === 1 ? '' : 's'}`}
                  </span>
                </div>

                <div className="pill pill--muted">
                  Progress: 0/{totalLessons || 0} · 0%
                </div>
              </div>

              <div className="userPill">
                Logged in as <span>{displayName}</span>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <Link href="/strategy" className="link">
                ← Back to modules
              </Link>

              {isAdmin && (
                <span style={{ marginLeft: 12 }}>
                  <Link href="/admin" className="link">
                    Admin →
                  </Link>
                </span>
              )}
            </div>
          </div>
        </section>

        {/* NEXT UP */}
        {nextLesson && (
          <section className="nextCard">
            <div className="nextLeft">
              <p className="nextEyebrow">Next up</p>
              <p className="nextTitle">{nextLesson.title}</p>
              <p className="nextSub">Tap below to jump into the next lesson.</p>
            </div>

            <Link
              href={`/strategy/${moduleRow.id}/${nextLesson.id}`}
              className="nextBtn"
            >
              Open lesson →
            </Link>
          </section>
        )}

        {/* LESSON LIST */}
        <section className="card">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Lesson outline</h2>
            <Link href="/strategy" className="link">
              All modules →
            </Link>
          </div>

          {loadingData ? (
            <p className="empty">Loading lessons…</p>
          ) : error ? (
            <p className="empty">{error}</p>
          ) : lessons.length === 0 ? (
            <p className="empty">No lessons have been added to this module yet.</p>
          ) : (
            <div className="list">
              {lessons.map((l, idx) => (
                <Link
                  key={l.id}
                  href={`/strategy/${moduleRow.id}/${l.id}`}
                  className="lessonItem"
                >
                  <div className="lessonLeft">
                    <div className="lessonNum">{idx + 1}</div>
                    <div className="lessonText">
                      <p className="lessonTitle">{l.title}</p>
                      <p className="lessonSub">
                        Tap to open this lesson. Your progress is saved
                        automatically.
                      </p>
                    </div>
                  </div>

                  <span className="statusPill">Not started</span>
                </Link>
              ))}
            </div>
          )}
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

  .mod-screen{
    width:100%;
    display:flex;
    justify-content:center;
    padding:12px 16px 24px;
  }
  .mod-inner{
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
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .card--hero{ gap:6px; }

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

  .heroRow{
    margin-top:10px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
  }
  .chips{ display:flex; flex-wrap:wrap; gap:8px; }

  .pill{
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:4px 10px;
    border-radius:999px;
    background: var(--ia-green-soft);
    color: var(--ia-green);
    font-size:11px;
    font-weight:800;
    white-space:nowrap;
  }
  .pill--muted{
    background: rgba(15,23,42,.04);
    color:#4b5563;
    font-weight:700;
  }
  .dot{
    width:6px;
    height:6px;
    border-radius:999px;
    background: var(--ia-green);
  }

  .userPill{
    font-size:12px;
    padding:4px 10px;
    border-radius:999px;
    background: rgba(15,23,42,.04);
    color:#4b5563;
    white-space:nowrap;
  }
  .userPill span{ font-weight:800; }

  .link{
    font-size:12px;
    color: var(--ia-green);
    text-decoration:none;
    font-weight:800;
  }
  .link:hover{ text-decoration:underline; }

  /* NEXT UP = textured */
  .nextCard{
    border-radius:22px;
    padding:14px 16px 16px;
    box-shadow: var(--shadow-brand);
    border:1px solid rgba(255,255,255,.14);

    background-image: url('/bg/ia-texture.png');
    background-size: cover;
    background-position: center;
    background-repeat:no-repeat;
    position:relative;
    overflow:hidden;

    color:#fff;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
  }
  .nextCard::after{
    content:'';
    position:absolute;
    inset:0;
    background: linear-gradient(
      135deg,
      rgba(11,46,35,.88),
      rgba(15,61,46,.72)
    );
    pointer-events:none;
  }
  .nextCard > *{ position:relative; z-index:1; }

  .nextEyebrow{
    margin:0 0 4px;
    font-size:11px;
    text-transform:uppercase;
    letter-spacing:.16em;
    opacity:.92;
  }
  .nextTitle{
    margin:0 0 2px;
    font-size:18px;
    font-weight:900;
  }
  .nextSub{
    margin:0;
    font-size:12px;
    opacity:.95;
  }

  .nextBtn{
    border-radius:999px;
    padding:10px 16px;
    background: rgba(255,255,255,.14);
    border:1px solid rgba(255,255,255,.18);
    color:#fff;
    text-decoration:none;
    font-size:13px;
    font-weight:900;
    backdrop-filter: blur(8px);
    white-space:nowrap;
    display:inline-flex;
    align-items:center;
    justify-content:center;
  }

  .sectionHeader{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:8px;
  }
  .sectionTitle{
    margin:0;
    font-size:16px;
    font-weight:900;
    color:#111827;
  }
  .empty{
    margin:4px 0 0;
    font-size:13px;
    color:#6b7280;
  }

  .list{
    display:flex;
    flex-direction:column;
    gap:8px;
  }

  .lessonItem{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    border-radius:16px;
    padding:10px 12px;
    text-decoration:none;
    color:#0f172a;
    background: linear-gradient(145deg, #ffffff, rgba(15,61,46,.04));
    border:1px solid var(--ia-border-soft);
    box-shadow: 0 14px 36px rgba(15,23,42,.12);
    transition: transform .08s ease-out, box-shadow .12s ease-out;
  }
  .lessonItem:hover{
    transform: translateY(-1px);
    box-shadow: 0 18px 50px rgba(15,23,42,.16);
  }

  .lessonLeft{
    display:flex;
    gap:10px;
    align-items:flex-start;
    flex:1;
    min-width:0;
  }

  .lessonNum{
    width:34px;
    height:34px;
    border-radius:999px;
    background: rgba(15,61,46,.10);
    color: var(--ia-green);
    display:flex;
    align-items:center;
    justify-content:center;
    font-weight:900;
    flex-shrink:0;
  }

  .lessonText{ min-width:0; }
  .lessonTitle{
    margin:0;
    font-size:14px;
    font-weight:900;
    color:#111827;
  }
  .lessonSub{
    margin:0;
    font-size:12px;
    color:#6b7280;
  }

  .statusPill{
    padding:6px 10px;
    border-radius:999px;
    font-size:10px;
    font-weight:900;
    letter-spacing:.12em;
    text-transform:uppercase;
    background: var(--ia-green-soft);
    color: var(--ia-green);
    white-space:nowrap;
  }

  .bottomSafe{ height:80px; }

  @media (max-width:720px){
    .mod-screen{ padding:10px 12px 80px; }
    .heroRow{ flex-direction:column; align-items:flex-start; }
    .nextCard{ flex-direction:column; align-items:flex-start; }
    .nextBtn{ width:100%; text-align:center; }
  }
`;