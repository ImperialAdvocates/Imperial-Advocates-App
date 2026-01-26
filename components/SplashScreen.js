// components/SplashScreen.js
export default function SplashScreen() {
  return (
    <div className="ia-splash">
      <div className="ia-splash-card">
        <div className="ia-splash-logoWrap">
          <img
            src="/ia-logo.png"
            alt="Imperial Advocates"
            className="ia-splash-logo"
            draggable="false"
          />
        </div>

        <div className="ia-splash-text">
          <div className="ia-splash-title">IMPERIAL ADVOCATES</div>
          <div className="ia-splash-subtitle">Investor Training &amp; Client Portal</div>
        </div>

        <div className="ia-splash-dots" aria-label="Loading">
          <span />
          <span />
          <span />
        </div>
      </div>

      <style jsx>{`
        .ia-splash {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: #f5f7fb;
        }

        .ia-splash-card {
          width: 100%;
          max-width: 520px;
          background: rgba(255, 255, 255, 0.96);
          border-radius: 28px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
          padding: 28px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        /* ✅ IMPORTANT: fixed square keeps logo from stretching */
        .ia-splash-logoWrap {
          width: 150px;
          height: 150px;
          border-radius: 28px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ia-splash-logo {
          width: 100%;
          height: 100%;
          object-fit: cover; /* ✅ keeps it looking like an app icon */
          object-position: center;
          user-select: none;
          -webkit-user-drag: none;
        }

        .ia-splash-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }

        .ia-splash-title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #111827;
        }

        .ia-splash-subtitle {
          font-size: 16px;
          color: #6b7280;
          font-weight: 500;
        }

        .ia-splash-dots {
          display: flex;
          gap: 10px;
          margin-top: 6px;
        }

        .ia-splash-dots span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 0.35);
          animation: pulse 1.1s ease-in-out infinite;
        }

        .ia-splash-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }
        .ia-splash-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}