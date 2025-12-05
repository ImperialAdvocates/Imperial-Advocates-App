// components/SplashScreen.js
import Image from 'next/image';

export default function SplashScreen() {
  return (
    <div className="ia-splash-root">
      <div className="ia-splash-content">
        <div className="ia-splash-logo-wrap">
          <div className="ia-splash-logo-glow" />
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
          <h1>Imperial Advocates</h1>
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
          background: radial-gradient(
              circle at top,
              #1d2cff 0,
              #050a40 40%,
              #03051f 100%
            );
          display: flex;
          align-items: center;
          justify-content: center;
          padding: calc(env(safe-area-inset-top, 0px) + 16px)
            16px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
        }

        .ia-splash-content {
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #ffffff;
          animation: iaFadeIn 0.6s ease-out forwards;
        }

        .ia-splash-logo-wrap {
          position: relative;
          margin-bottom: 20px;
        }

        .ia-splash-logo-glow {
          position: absolute;
          inset: -24px;
          border-radius: 32px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.16),
            transparent 70%
          );
          filter: blur(4px);
          opacity: 0.7;
          pointer-events: none;
        }

        .ia-splash-logo {
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .ia-splash-text-block h1 {
          margin: 0;
          font-size: 24px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .ia-splash-text-block p {
          margin: 8px 0 0;
          font-size: 13px;
          opacity: 0.82;
        }

        .ia-splash-loader {
          margin-top: 26px;
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .ia-splash-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #f6e7b8;
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
            transform: translateY(12px);
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

        @media (min-width: 768px) {
          .ia-splash-content {
            max-width: 420px;
          }
          .ia-splash-text-block h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}