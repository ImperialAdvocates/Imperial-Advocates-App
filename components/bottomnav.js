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

  const renderIcon = (href) => {
    const common = {
      viewBox: '0 0 24 24',
      className: 'ia-nav-icon-svg',
      'aria-hidden': 'true',
    };

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

    if (href.startsWith('/noticeboard')) {
      return (
        <svg {...common}>
          <path
            d="M8 7h6a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="9"
            cy="7"
            r="2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
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

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active ? 'ia-nav-link ia-nav-link--active' : 'ia-nav-link'
              }
            >
              <div className="ia-nav-item">
                <span className="ia-nav-icon-wrap">{icon}</span>
                <span className="ia-nav-label">{item.label}</span>
              </div>
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
          z-index: 999;
          padding: 0 16px 12px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom));
          background: transparent;
        }

        .ia-nav-inner {
          max-width: 520px;
          margin: 0 auto;
          height: 56px;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 10px;
        }

        .ia-nav-link {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #a1a6c0;
        }

        .ia-nav-link--active {
          color: #3b4bd1;
        }

        .ia-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          font-size: 11px;
        }

        .ia-nav-icon-wrap {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ia-nav-link--active .ia-nav-icon-wrap {
          background: rgba(59, 75, 209, 0.08);
        }

        .ia-nav-label {
          font-size: 11px;
        }

        .ia-nav-icon-svg {
          width: 22px;
          height: 22px;
          display: block;
        }

        .ia-nav-avatar-wrap {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 1.4px solid rgba(59, 75, 209, 0.9);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ia-nav-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: inherit;
        }

        .ia-nav-avatar-initial {
          font-size: 12px;
          font-weight: 600;
          background: #3b4bd1;
          color: #ffffff;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 720px) {
          .ia-nav-inner {
            max-width: 520px;
          }
        }
      `}</style>
    </nav>
  );
}