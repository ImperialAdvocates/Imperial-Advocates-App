// components/SplashScreen.js
import Image from 'next/image';

export default function SplashScreen() {
  return (
    <div className="ia-splash-root">
      <div className="ia-splash-content">
        <div className="ia-splash-logo-wrap">
          <Image
            src="/ia-logo.png"
            alt="Imperial Advocates"
            width={220}
            height={120}
            priority
            className="ia-splash-logo"
          />
        </div>

        <div className="ia-splash-text-block">
          <h1>IMPERIAL ADVOCATES</h1>
          <p>Investor Training &amp; Client Portal</p>
        </div>

        <div className="ia-splash-loader">
          <div className="ia-splash-dot" />
          <div className="ia-splash-dot" />
          <div className="ia-splash-dot" />
        </div>
      </div>

      <style jsx>{`
        .ia-splash-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #f5f7fb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: calc(env(safe-area-inset-top, 0px) + 16px)
            16px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .ia-splash-content {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 24px;
          padding: 28px 24px 24px;
          box-shadow: 0 22px 55px rgba(15, 23, 42, 0.12);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #111827;
          animation: iaFadeIn 0.5s ease-out forwards;
        }

        .ia-splash-logo-wrap {
          margin-bottom: 16px;
        }

        .ia-splash-logo {
          border-radius: 18px;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.25);
        }

        .ia-splash-text-block h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #151827;
        }

        .ia-splash-text-block p {
          margin: 6px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .ia-splash-loader {
          margin-top: 18px;
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .ia-splash-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: radial-gradient(circle at top left, #e0e7ff, #1d2cff);
          opacity: 0.4;
          animation: iaPulse 1.2s ease-in-out infinite;
        }

        .ia-splash-dot:nth-child(2) {
          animation-delay: 0.18s;
        }

        .ia-splash-dot:nth-child(3) {
          animation-delay: 0.36s;
        }

        @keyframes iaFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes iaPulse {
          0% {
            opacity: 0.3;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-3px);
          }
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .ia-splash-content {
            padding: 24px 18px 20px;
          }
        }
      `}</style>
    </div>
  );
}