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
        setError(authError.message || 'Unable to sign in.');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-inner">

        {/* IA Header */}
        <header className="login-header">
          <img src="/ia-logo.png" alt="IA" className="header-logo" />
          <div className="header-text">
            <h1 className="header-title">IMPERIAL ADVOCATES</h1>
            <p className="header-sub">Investor Training & Client Portal</p>
          </div>
        </header>

        {/* Card */}
        <main className="login-card">
          <h2 className="card-title">Welcome back</h2>
          <p className="card-subtitle">
            Enter your details to access your Imperial Advocates portal.
          </p>

          <form onSubmit={handleLogin} className="form">

            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="footer-row">
            <span>Don’t have an account?</span>
            <Link href="/signup" className="footer-link">
              Create one
            </Link>
          </div>
        </main>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: #f5f7fb;
          display: flex;
          justify-content: center;
          padding: 24px 16px;
        }

        .login-inner {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* HEADER — matches dashboard */
        .login-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
        }

        .header-logo {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .header-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #151827;
        }

        .header-sub {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        /* CARD */
        .login-card {
          background: #ffffff;
          border-radius: 22px;
          padding: 20px 22px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        }

        .card-title {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .card-subtitle {
          margin: 0 0 16px;
          font-size: 13px;
          color: #6b7280;
        }

        /* INPUTS — match profile/dashboard */
        .field-label {
          margin-bottom: 4px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6b7280;
        }

        .field-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          color: #111827;
          padding: 10px 12px;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .field-input:focus {
          outline: none;
          border-color: #6366f1;
          background: #ffffff;
        }

        .error-text {
          margin-top: -4px;
          margin-bottom: 6px;
          font-size: 12px;
          color: #dc2626;
        }

        /* BUTTON — same gradient as dashboard */
        .primary-btn {
          margin-top: 6px;
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 11px 16px;
          font-size: 15px;
          font-weight: 600;
          background: linear-gradient(135deg, #1D2CFF, #0A0F4F);
          color: #ffffff;
          box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
        }

        .primary-btn[disabled] {
          opacity: 0.7;
        }

        /* FOOTER */
        .footer-row {
          margin-top: 14px;
          font-size: 13px;
          display: flex;
          gap: 4px;
          justify-content: center;
          color: #6b7280;
        }

        .footer-link {
          color: #555fe0;
          text-decoration: none;
        }

        .footer-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}