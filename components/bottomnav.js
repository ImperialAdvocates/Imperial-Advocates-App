// components/bottomnav.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useProfile } from '../hooks/useProfile';

export default function BottomNav() {
  const router = useRouter();
  const { profile, isAdmin } = useProfile() || {};

  const currentPath = router.asPath || router.pathname || '/';

  const avatarInitial =
    (profile?.first_name && profile.first_name.trim()[0]) ||
    (profile?.username && profile.username.trim()[0]) ||
    (profile?.email && profile.email.trim()[0]) ||
    'A';

  const avatarUrl = profile?.avatar_url || null;

  const baseItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/noticeboard', label: 'Noticeboard' },
    { href: '/profile', label: 'Profile' },
  ];

  const items = isAdmin
    ? [
        baseItems[0],
        baseItems[1],
        baseItems[2],
        { href: '/admin', label: 'Admin' },
        baseItems[3],
      ]
    : baseItems;

  const isActive = (path) => {
    if (path === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  // ICONS
  const renderIcon = (href) => {
    const common = {
      viewBox: '0 0 24 24',
      className: 'ia-nav-icon-svg',
      'aria-hidden': 'true',
    };

    // Home
    if (href.startsWith('/dashboard')) {
      return (
        <svg {...common}>
          <path
            d="M5 10.5 12 4l7 6.5V19a1.2 1.2 0 0 1-1.2 1.2h-3.8a.7.7 0 0 1-.7-.7v-4.3H10v4.3a.7.7 0 0 1-.7.7H5.5A1.2 1.2 0 0 1 4.3 19v-8.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    // Courses
    if (href.startsWith('/courses')) {
      return (
        <svg {...common}>
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M10.4 15.2V8.8a.7.7 0 0 1 1.1-.6l3.6 2.8a.8.8 0 0 1 0 1.3l-3.6 2.8a.7.7 0 0 1-1.1-.6Z"
            fill="currentColor"
          />
        </svg>
      );
    }

    // Noticeboard (board + pin / key style)
    if (href.startsWith('/noticeboard')) {
      return (
        <svg {...common}>
          {/* board */}
          <path
            d="M8 7h6a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* pin circle */}
          <circle
            cx="9"
            cy="7"
            r="2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          {/* arm */}
          <path
            d="M10.5 8.5 13 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    // Admin
    if (href.startsWith('/admin')) {
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="3.1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M5.1 12.7a7.2 7.2 0 0 1 0-1.4L3.7 10l1.3-2.3 1.8.4a7 7 0 0 1 1.2-.7l.3-1.8h2.6l.3 1.8 1.2.7 1.8-.4L20.3 10l-1.4 1.3a7.2 7.2 0 0 1 0 1.4l1.4 1.3-1.3 2.3-1.8-.4a7 7 0 0 1-1.2.7l-.3 1.8H9.3l-.3-1.8-1.2-.7-1.8.4L3.7 14l1.4-1.3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    // fallback dot
    return <span className="ia-nav-icon-svg">•</span>;
  };

  return (
    <nav className="ia-nav">
      <div className="ia-nav-inner">
        {items.map((item) => {
          const active = isActive(item.href);
          const isProfile = item.href.startsWith('/profile');

          const icon = isProfile ? (
            <span className="ia-nav-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="ia-nav-avatar" />
              ) : (
                <span className="ia-nav-avatar ia-nav-avatar-initial">
                  {avatarInitial}
                </span>
              )}
            </span>
          ) : (
            renderIcon(item.href)
          );

          if (active) {
            // ACTIVE: pill with icon + label
            return (
              <Link
                key={item.href}
                href={item.href}
                className="ia-nav-link ia-nav-link--active"
              >
                <span className="ia-nav-pill">
                  <span className="ia-nav-icon-wrap">{icon}</span>
                  <span className="ia-nav-label">{item.label}</span>
                </span>
              </Link>
            );
          }

          // INACTIVE: circle with icon
          return (
            <Link key={item.href} href={item.href} className="ia-nav-link">
              <span className="ia-nav-circle">{icon}</span>
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
          height: 64px;
          z-index: 999;
          background: radial-gradient(circle at top, #050815, #02030a 70%);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .ia-nav-inner {
          max-width: 900px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 16px;
          gap: 12px;
        }

        .ia-nav-link {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.9);
        }

        .ia-nav-link--active {
          color: #ffffff;
        }

        /* ACTIVE pill */
        .ia-nav-pill {
          min-width: 120px;
          height: 44px;
          padding: 0 18px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: radial-gradient(circle at top, #101a63, #050824 70%);
          border: 1px solid rgba(246, 231, 184, 0.95);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.95);
        }

        .ia-nav-label {
          font-size: 13px;
          font-weight: 600;
        }

        /* INACTIVE circles */
        .ia-nav-circle {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(
            circle at center,
            rgba(45, 55, 110, 0.45),
            rgba(10, 15, 40, 0.95)
          );
          backdrop-filter: blur(8px);
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.85);
        }

        /* icon size */
        .ia-nav-icon-svg {
          width: 24px;
          height: 24px;
          display: block;
        }

        /* avatar styles */
        .ia-nav-avatar-wrap {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1.6px solid rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.85);
        }

        .ia-nav-avatar {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          object-fit: cover;
        }

        .ia-nav-avatar-initial {
          font-size: 13px;
          font-weight: 600;
          background: #000000;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 1024px) {
          .ia-nav {
            height: 66px;
          }
          .ia-nav-inner {
            max-width: 640px;
          }
        }
      `}</style>
    </nav>
  );
}