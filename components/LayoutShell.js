// components/LayoutShell.js
import { useRouter } from 'next/router';
import { useProfile } from '../hooks/useProfile';
import BottomNav from './bottomnav';

export default function LayoutShell({ children }) {
  const router = useRouter();
  const { profile, isAdmin } = useProfile() || {};

  // Base nav items
  const baseNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/courses', label: 'Courses' },
    { href: '/noticeboard', label: 'Noticeboard' },
  ];

  // Build final nav: base + optional admin + profile last
  const navItems = [
    ...baseNavItems,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
    { href: '/profile', label: 'Profile' },
  ];

  const avatarInitial =
    (profile?.first_name && profile.first_name[0]?.toUpperCase()) ||
    (profile?.email && profile.email[0]?.toUpperCase()) ||
    'I';

  const avatarUrl = profile?.avatar_url || null;

  return (
    <div className="ia-shell">
      {/* TOP BANNER */}
      <header className="ia-header">
        <div className="ia-header-bar">
          <div className="ia-header-brand">
            <img src="/ia-logo.png" alt="Imperial Advocates" />
            <div className="ia-header-text">
              <div className="ia-header-title">IMPERIAL ADVOCATES</div>
              <div className="ia-header-subtitle">
                Investor Training &amp; Client Portal
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="ia-main">
        <div className="ia-main-inner">{children}</div>
      </main>

      {/* BOTTOM NAV */}
      <BottomNav
        items={navItems}
        currentPath={router.pathname}
        avatarInitial={avatarInitial}
        avatarUrl={avatarUrl}
      />

      <style jsx>{`
        .ia-shell {
          min-height: 100vh;
          background: radial-gradient(circle at top, #0d1a80 0%, #020316 55%);
          color: #fff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro',
            'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          padding-top: 86px; /* header height */
          padding-bottom: 80px; /* bottom nav height + safe area */
        }

        .ia-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 86px;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            to bottom,
            #f7f6fc 0%,
            #fdf8f1 40%,
            rgba(247, 246, 252, 0.65) 100%
          );
        }

        .ia-header-bar {
          position: relative;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          padding: 10px 16px;
        }

        .ia-header-brand {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ia-header-brand img {
          height: 46px;
          width: auto;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        }

        .ia-header-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .ia-header-title {
          font-size: 14px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #0b0d40;
          font-weight: 700;
        }

        .ia-header-subtitle {
          margin-top: 2px;
          font-size: 11px;
          letter-spacing: 0.04em;
          color: #2f3550;
          font-weight: 500;
        }

        .ia-main {
          flex: 1;
        }

        .ia-main-inner {
          max-width: 1080px;
          margin: 0 auto;
          padding: 12px 16px 32px;
        }

        @media (max-width: 720px) {
          .ia-shell {
            padding-top: 82px;
            padding-bottom: calc(84px + env(safe-area-inset-bottom));
          }

          .ia-header {
            height: 82px;
          }

          .ia-header-bar {
            padding: 8px 12px;
          }

          .ia-header-brand img {
            height: 40px;
          }

          .ia-header-title {
            font-size: 12px;
          }

          .ia-header-subtitle {
            font-size: 10px;
          }

          .ia-main-inner {
            padding: 8px 12px 28px;
          }
        }
      `}</style>
    </div>
  );
}