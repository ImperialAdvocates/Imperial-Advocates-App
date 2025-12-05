// components/bottomnav.js
import Link from 'next/link';

export default function BottomNav({
  items,
  currentPath,
  avatarInitial = 'I',
  avatarUrl = null,
}) {
  const isActive = (path) => {
    if (path === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const renderIcon = (href) => {
    if (href.startsWith('/dashboard')) {
      return (
        <svg viewBox="0 0 24 24" className="ia-nav-icon-svg" aria-hidden="true">
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5a.5.5 0 0 1-.5-.5v-5h-4v5a.5.5 0 0 1-.5.5H5a1 1 0 0 1-1-1v-9.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (href.startsWith('/courses')) {
      return (
        <svg viewBox="0 0 24 24" className="ia-nav-icon-svg" aria-hidden="true">
          <rect
            x="3.5"
            y="3.5"
            width="17"
            height="17"
            rx="4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M10 15.3V8.7a.6.6 0 0 1 .9-.5l4.4 3.3a.6.6 0 0 1 0 1l-4.4 3.3a.6.6 0 0 1-.9-.5Z"
            fill="currentColor"
          />
        </svg>
      );
    }

    if (href.startsWith('/noticeboard')) {
      return (
        <svg viewBox="0 0 24 24" className="ia-nav-icon-svg" aria-hidden="true">
          <path
            d="M4.5 11.5 18.5 5l-4.3 14-2.1-5.6-5.6-1.9Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (href.startsWith('/admin')) {
      return (
        <svg viewBox="0 0 24 24" className="ia-nav-icon-svg" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M4.8 12a7.2 7.2 0 0 1 .1-1l-1.7-1.3 1.8-3.1 2 .6a7 7 0 0 1 1.7-1l.3-2.1h3.6l.3 2.1a7 7 0 0 1 1.7 1l2-.6 1.8 3.1-1.7 1.3a7.2 7.2 0 0 1 0 2l1.7 1.3-1.8 3.1-2-.6a7 7 0 0 1-1.7 1l-.3 2.1H9.2l-.3-2.1a7 7 0 0 1-1.7-1l-2 .6-1.8-3.1 1.7-1.3a7.2 7.2 0 0 1-.1-1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    return <span className="ia-nav-icon-svg">•</span>;
  };

  return (
    <nav className="ia-nav">
      <div className="ia-nav-inner">
        {items.map((item) => {
          const active = isActive(item.href);
          const isProfile = item.href.startsWith('/profile');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'ia-nav-link active' : 'ia-nav-link'}
            >
              <span className="ia-nav-icon-wrap">
                {isProfile ? (
                  <span className="ia-nav-avatar-wrap">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="ia-nav-avatar"
                      />
                    ) : (
                      <span className="ia-nav-avatar ia-nav-avatar-initial">
                        {avatarInitial}
                      </span>
                    )}
                  </span>
                ) : (
                  renderIcon(item.href)
                )}
              </span>

              <span className="ia-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .ia-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 54px;
          z-index: 999;
          background: rgba(0, 0, 0, 0.92);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .ia-nav-inner {
          max-width: 900px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 12px;
        }

        .ia-nav-link {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.75);
          font-size: 9px;
          line-height: 1.1;
          gap: 3px;
          transition: color 0.14s ease-out, transform 0.1s ease-out;
        }

        .ia-nav-link.active {
          color: #ffffff;
        }

        .ia-nav-icon-wrap {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ia-nav-icon-svg {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }

        .ia-nav-avatar-wrap {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 1.3px solid rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ia-nav-avatar {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: cover;
        }

        .ia-nav-avatar-initial {
          font-size: 9px;
          font-weight: 600;
          background: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ia-nav-link:active .ia-nav-icon-wrap,
        .ia-nav-link:active .ia-nav-avatar-wrap {
          transform: scale(0.9);
        }

        @media (min-width: 1024px) {
          .ia-nav {
            height: 56px;
          }

          .ia-nav-inner {
            max-width: 640px;
          }
        }
      `}</style>
    </nav>
  );
}