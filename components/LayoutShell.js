// components/LayoutShell.js
import BottomNav from './bottomnav';

export default function LayoutShell({ children }) {
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
      <BottomNav />

      <style jsx>{`
        .ia-shell {
          min-height: 100vh;
          background: #f5f7fb;
          color: #111320;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          /* header + safe area */
          padding-top: calc(60px + env(safe-area-inset-top, 0px));
          /* ✅ only a SMALL buffer above the bottom nav */
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        }

        .ia-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: calc(60px + env(safe-area-inset-top, 0px));
          z-index: 40;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-top: env(safe-area-inset-top, 0px);
          background: linear-gradient(
            to bottom,
            #f7f6fc 0%,
            #fdf8f1 40%,
            rgba(247, 246, 252, 0.78) 100%
          );
          border-bottom: 1px solid rgba(203, 209, 234, 0.7);
        }

        .ia-header-bar {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          padding: 4px 16px 8px;
          display: flex;
          justify-content: center;
        }

        .ia-header-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .ia-header-brand img {
          height: 36px;
          width: auto;
          border-radius: 12px;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.22);
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
          /* ✅ no extra bottom padding – pages handle their own spacing */
          padding: 0 0 calc(32px + env(safe-area-inset-bottom, 0px));
        }

        @media (max-width: 720px) {
          .ia-shell {
            padding-top: calc(60px + env(safe-area-inset-top, 0px));
            padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
          }

          .ia-header {
            height: calc(60px + env(safe-area-inset-top, 0px));
          }

          .ia-header-bar {
            padding: 4px 12px 8px;
          }

          .ia-header-brand img {
            height: 34px;
          }

          .ia-header-title {
            font-size: 12px;
          }

          .ia-header-subtitle {
            font-size: 10px;
          }

          .ia-main-inner {
            padding: 0 12px 0;
          }
        }
      `}</style>

      {/* Global base styles */}
      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: inherit;
          background: #f5f7fb;
          color: #111320;
        }

        * {
          box-sizing: border-box;
        }

        a {
          color: inherit;
        }

        .top-nav,
        .nav-links-desktop,
        .nav-links-mobile {
          display: none !important;
        }
      `}</style>
    </div>
  );
}