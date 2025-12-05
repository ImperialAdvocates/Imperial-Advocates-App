// pages/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        console.error('Login error:', authError);
        setError(authError.message || 'Unable to sign in.');
        return;
      }

      // Success → go to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-shell">
        {/* Top branding header */}
        <header className="auth-header">
          <div className="logo-wrap">
            <img
              src="/ia-logo.png"
              alt="Imperial Advocates"
              className="logo-img"
            />
          </div>
          <p className="brand-kicker">IMPERIAL ADVOCATES</p>
          <h1 className="brand-title">
            Investor Training &amp; Client Portal
          </h1>
          <p className="brand-subtitle">
            Log in to access your NDIS, co-living and rooming house
            training, resources and client updates.
          </p>
        </header>

        {/* Main card */}
        <main className="card">
          <h2 className="card-title">Welcome back</h2>
          <p className="card-subtitle">
            Enter your details to access your Imperial Advocates portal.
          </p>

          <form onSubmit={handleLogin} className="form">
            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer">
            <span>Don&apos;t have an account?</span>
            <Link href="/signup" className="link">
              Create one
            </Link>
          </div>
        </main>
      </div>

      <style jsx>{`
        .auth-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: radial-gradient(
              circle at top left,
              rgba(217, 72, 65, 0.35),
              transparent 55%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(198, 166, 103, 0.28),
              transparent 50%
            ),
            radial-gradient(
              circle at top right,
              rgba(10, 20, 124, 0.85),
              #020314 70%
            );
          color: #ffffff;
        }

        .auth-shell {
          width: 100%;
          max-width: 960px;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 24px;
          align-items: center;
        }

        .auth-header {
          padding: 18px 10px 18px 0;
        }

        .logo-wrap {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: radial-gradient(
            circle at top left,
            rgba(198, 166, 103, 0.5),
            rgba(5, 10, 64, 0.95)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.75);
        }

        .logo-img {
          max-width: 56px;
          max-height: 56px;
          object-fit: contain;
        }

        .brand-kicker {
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          opacity: 0.8;
          margin: 0 0 4px;
        }

        .brand-title {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 700;
        }

        .brand-subtitle {
          margin: 0;
          font-size: 13px;
          max-width: 380px;
          opacity: 0.9;
        }

        .card {
          border-radius: 22px;
          padding: 20px 20px 22px;
          background: radial-gradient(
              circle at top left,
              rgba(255, 255, 255, 0.06),
              transparent 50%
            ),
            rgba(5, 10, 64, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 26px 60px rgba(0, 0, 0, 0.9);
        }

        .card-title {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
        }

        .card-subtitle {
          margin: 0 0 16px;
          font-size: 13px;
          opacity: 0.85;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .field-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          opacity: 0.8;
        }

        .field-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(2, 4, 26, 0.95);
          padding: 10px 12px;
          font-size: 14px;
          color: #ffffff;
        }

        .field-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .field-input:focus {
          outline: none;
          border-color: rgba(246, 231, 184, 0.9);
          box-shadow: 0 0 0 1px rgba(246, 231, 184, 0.7);
        }

        .error-text {
          margin: 2px 0 0;
          font-size: 12px;
          color: #ffb3b3;
        }

        .primary-btn {
          margin-top: 4px;
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 11px 16px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          color: #ffffff;
          background: linear-gradient(135deg, #d94841, #ff8b5f);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.85);
          transition: transform 0.08s ease-out, box-shadow 0.08s ease-out,
            opacity 0.1s ease-out;
        }

        .primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 50px rgba(0, 0, 0, 0.95);
        }

        .primary-btn:active {
          transform: translateY(0);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.9);
        }

        .primary-btn[disabled] {
          opacity: 0.7;
          cursor: default;
        }

        .auth-footer {
          margin-top: 12px;
          font-size: 13px;
          display: flex;
          gap: 4px;
          justify-content: center;
          opacity: 0.9;
        }

        .link {
          color: #f6e7b8;
          text-decoration: none;
        }

        .link:hover {
          text-decoration: underline;
        }

        @media (max-width: 820px) {
          .auth-shell {
            grid-template-columns: minmax(0, 1fr);
          }

          .auth-header {
            text-align: center;
            padding: 0;
          }

          .logo-wrap {
            margin: 0 auto 10px;
          }

          .brand-subtitle {
            margin: 0 auto;
          }

          .card {
            margin-top: 6px;
          }
        }

        @media (max-width: 480px) {
          .brand-title {
            font-size: 20px;
          }
          .card {
            padding: 16px 14px 18px;
          }
        }
      `}</style>
    </div>
  );
}