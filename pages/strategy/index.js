// pages/strategy/index.js
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

const BOOK_CALL_URL =
  'https://api.leadconnectorhq.com/widget/booking/gBhfSeUYYjXTgOIPNVYt';

function LockedStrategy() {
  return (
    <div className="locked">
      <h1>Strategy locked</h1>
      <p>
        Unlock access to Strategy Preparation by booking an information session
        with our team.
      </p>

      <a
        href={BOOK_CALL_URL}
        target="_blank"
        rel="noreferrer"
        className="locked-btn ia-btn-primary ia-texture-strong"
      >
        Book an information session
      </a>

      <style jsx>{`
        .locked {
          min-height: 50vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          gap: 12px;
        }
        h1 {
          font-size: 20px;
          font-weight: 900;
          color: #111827;
          margin: 0;
        }
        p {
          font-size: 14px;
          color: #6b7280;
          max-width: 380px;
          line-height: 1.5;
          margin: 0;
        }
        .locked-btn {
          margin-top: 6px;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}

export default function StrategyIndex() {
  const { profile, loading: profileLoading, isAdmin } = useProfile() || {};
  const role = profile?.role || 'viewer';
  const isInvestor = useMemo(() => ['investor', 'admin'].includes(role), [role]);

  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setError('');
        setLoadingModules(true);

        if (profileLoading) return;
        if (!isInvestor) return; // viewers locked (no module query)

        const { data, error: qErr } = await supabase
          .from('strategy_modules')
          .select('id, title, description')
          .order('created_at', { ascending: true });

        if (qErr) throw qErr;
        if (!alive) return;

        setModules(data || []);
      } catch (e) {
        console.error('Strategy modules load error:', e);
        if (!alive) return;
        setError(e?.message || 'Could not load strategy modules.');
        setModules([]);
      } finally {
        if (alive) setLoadingModules(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [profileLoading, isInvestor]);

  if (profileLoading) return <p style={{ padding: 16 }}>Loading…</p>;

  // Viewers: hero + lock (no overview/doc)
  if (!isInvestor) {
    return (
      <div className="strategy-screen">
        <div className="strategy-inner">
          <section className="strategy-hero">
            <div className="hero-left">
              <p className="eyebrow">STRATEGY</p>
              <h1 className="title">Strategy preparation</h1>
              <p className="sub">
                Work through these modules to prepare for your next steps with
                Imperial Advocates.
              </p>
            </div>
          </section>

          <LockedStrategy />

          <div className="bottomSafe" />
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  }

  // Investor/Admin: hero + modules only (no overview/doc)
  return (
    <div className="strategy-screen">
      <div className="strategy-inner">
        <section className="strategy-hero">
          <div className="hero-left">
            <p className="eyebrow">STRATEGY</p>
            <h1 className="title">Strategy preparation</h1>
            <p className="sub">
              Work through these modules to prepare for your next steps with
              Imperial Advocates.
            </p>
          </div>

          <div className="hero-meta">
            <div className="pill">
              <span className="dot" />
              <span>
                {modules.length} module{modules.length === 1 ? '' : 's'}
              </span>
            </div>

            {isAdmin && (
              <Link href="/admin" className="manageLink">
                Admin →
              </Link>
            )}
          </div>
        </section>

        {/* MODULES */}
        <section className="strategy-card">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Modules</h2>
          </div>

          {loadingModules ? (
            <p className="empty">Loading modules…</p>
          ) : error ? (
            <p className="empty">Could not load modules: {error}</p>
          ) : modules.length === 0 ? (
            <p className="empty">No strategy modules yet.</p>
          ) : (
            <div className="list">
              {modules.map((m) => (
                <Link key={m.id} href={`/strategy/${m.id}`} className="item">
                  <div className="itemMain">
                    <p className="itemTitle">{m.title}</p>
                    <p className="itemSub">{m.description || 'Open module →'}</p>
                  </div>
                  <span className="cta">Open →</span>
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
  .strategy-screen {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 12px 16px 24px;
  }

  .strategy-inner {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .strategy-hero {
    border-radius: 20px;
    padding: 14px 16px 16px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: var(--shadow-brand);
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  .eyebrow {
    margin: 0 0 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #9ca3af;
  }

  .title {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 900;
    color: #111827;
  }

  .sub {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: #4b5563;
  }

  .hero-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4b5563;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #4f46e5;
  }

  .manageLink {
    font-size: 12px;
    color: #4f46e5;
    text-decoration: none;
  }
  .manageLink:hover {
    text-decoration: underline;
  }

  .strategy-card {
    border-radius: 22px;
    padding: 14px 16px 16px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: var(--shadow-brand);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sectionHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sectionTitle {
    margin: 0;
    font-size: 16px;
    font-weight: 900;
    color: #111827;
  }

  .empty {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-radius: 16px;
    padding: 10px 12px;
    text-decoration: none;
    color: #0f172a;
    background: linear-gradient(145deg, #ffffff, #eef2ff);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.16),
      0 0 0 1px rgba(209, 213, 219, 0.7);
  }

  .itemMain {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .itemTitle {
    margin: 0;
    font-size: 14px;
    font-weight: 900;
    color: #111827;
  }

  .itemSub {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }

  .cta {
    font-size: 12px;
    font-weight: 700;
    color: #4f46e5;
    white-space: nowrap;
  }

  .bottomSafe {
    height: 80px;
  }

  @media (max-width: 720px) {
    .strategy-screen {
      padding: 10px 12px 80px;
    }

    .strategy-hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-meta {
      align-items: flex-start;
    }
  }
`;