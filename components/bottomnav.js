// components/bottomnav.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useProfile } from "../hooks/useProfile";

export default function BottomNav() {
  const router = useRouter();
  const { profile, isAdmin } = useProfile() || {};

  const currentPath = router.asPath || router.pathname || "/";

  const avatarInitial =
    (profile?.first_name && profile.first_name.trim()[0]) ||
    (profile?.username && profile.username.trim()[0]) ||
    (profile?.email && profile.email.trim()[0]) ||
    "I";

  const items = [
    { href: "/dashboard", key: "home" },
    { href: "/courses", key: "courses" },
    { href: "/noticeboard", key: "pin" },
    { href: "/profile", key: "profile" },
  ];

  if (isAdmin) {
    items.splice(3, 0, { href: "/admin", key: "admin" });
  }

  const isActive = (path) => {
    if (path === "/dashboard") {
      return currentPath === "/" || currentPath === "/dashboard";
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const stroke = 1.8;
  const size = 22;

  const icons = {
    home: (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5a.5.5 0 0 1-.5-.5v-5h-4v5a.5.5 0 0 1-.5.5H5a1 1 0 0 1-1-1v-9.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    courses: (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <rect
          x="3.6"
          y="3.6"
          width="16.8"
          height="16.8"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <path
          d="M10 15.5V8.5a.8.8 0 0 1 1.2-.6l4.4 3.4a.8.8 0 0 1 0 1.2l-4.4 3.4a.8.8 0 0 1-1.2-.4Z"
          fill="currentColor"
        />
      </svg>
    ),

    pin: (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <g transform="scale(0.9) translate(1.3 1.3)">
          <path
            d="M12 3.5c-2.3 0-4.3 1.9-4.3 4.3 0 3.1 3.3 6.9 4 7.7.2.2.5.2.7 0 .7-.8 4.1-4.6 4.1-7.7 0-2.4-2-4.3-4.5-4.3Zm0 6a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    ),

    admin: (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <path
          d="M4.8 12a7.1 7.1 0 0 1 .1-1l-1.7-1.3 1.7-3 2 .6a7 7 0 0 1 1.6-1l.3-2h3.4l.3 2a7 7 0 0 1 1.6 1l2-.6 1.7 3-1.7 1.3a7.1 7.1 0 0 1 0 2l1.7 1.3-1.7 3-2-.6a7 7 0 0 1-1.6 1l-.3 2H9.3l-.3-2a7 7 0 0 1-1.6-1l-2 .6-1.7-3 1.7-1.3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return (
    <nav className="ia-nav">
      <div className="ia-nav-inner">
        {items.map((item) => {
          const active = isActive(item.href);
          const isProfile = item.href.startsWith("/profile");

          const pillClass = active
            ? "ia-nav-pill ia-nav-pill--active"
            : "ia-nav-pill";

          return (
            <Link key={item.href} href={item.href} className="ia-nav-link">
              <span className={pillClass}>
                {isProfile ? (
                  <span className="ia-nav-avatar">
                    {avatarInitial}
                  </span>
                ) : (
                  icons[item.key]
                )}
              </span>
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
          height: 70px;
          background: radial-gradient(circle at top, #050815, #02030a 70%);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 999;
        }

        .ia-nav-inner {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .ia-nav-link {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .ia-nav-pill {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }

        .ia-nav-pill--active {
          background: linear-gradient(
            140deg,
            rgba(40, 55, 110, 0.7),
            rgba(10, 12, 30, 0.9)
          );
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(16px);
        }

        .ia-nav-pill:not(.ia-nav-pill--active):hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .ia-nav-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: black;
          color: white;
          border: 1.5px solid rgba(255, 255, 255, 0.85);
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </nav>
  );
}