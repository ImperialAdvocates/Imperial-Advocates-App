// pages/login.js
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <div className="ia-auth-root">
      <div className="ia-auth-card">
        {/* Logo + heading */}
        <div className="ia-auth-header">
          <img
            src="/ia-logo.png"
            alt="Imperial Advocates"
            className="ia-auth-logo"
          />
          <div className="ia-auth-title-block">
            <h1>Welcome back</h1>
            <p>Sign in to access your Imperial Advocates portal.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="ia-auth-form">
          <label className="ia-auth-label">Email</label>
          <input
            type="email"
            className="ia-auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoCapitalize="none"
          />

          <label className="ia-auth-label">Password</label>
          <input
            type="password"
            className="ia-auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {errorMsg && (
            <p className="ia-auth-error">
              {errorMsg}
            </p>
          )}

          <button type="submit" className="ia-auth-button">
            Sign in
          </button>
        </form>

        {/* Footer link */}
        <p className="ia-auth-footer-text">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="ia-auth-link">
            Create one
          </a>
        </p>
      </div>

      {/* Styles */}
      <style jsx>{`
        .ia-auth-root {
          min-height: 100vh;
          margin: 0;
          padding: calc(env(safe-area-inset-top, 0px) + 16px) 16px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(
              circle at top,
              #0a147c 0,
              #050a40 45%,
              #000000 100%
            );
          font-family: -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI',
            sans-serif;
          color: #ffffff;
        }

        .ia-auth-card {
          width: 100%;
          max-width: 420px;
          background: rgba(5, 10, 64, 0.96);
          border-radius: 24px;
          border: 1px solid rgba(198, 166, 103, 0.5);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.9);
          padding: 22px 20px 20px;
        }

        .ia-auth-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .ia-auth-logo {
          width: 64px;
          height: auto;
          border-radius: 14px;
          flex-shrink: 0;
        }

        .ia-auth-title-block h1 {
          margin: 0 0 4px;
          font-size: 20px;
          font-weight: 600;
        }

        .ia-auth-title-block p {
          margin: 0;
          font-size: 13px;
          opacity: 0.8;
        }

        .ia-auth-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 14px;
        }

        .ia-auth-label {
          font-size: 12px;
          opacity: 0.8;
        }

        .ia-auth-input {
          width: 100%;
          padding: 10px 11px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(3, 6, 40, 0.96);
          color: #ffffff;
          font-size: 13px;
          outline: none;
        }

        .ia-auth-input::placeholder {
          opacity: 0.6;
        }

        .ia-auth-error {
          margin: 4px 0 0;
          font-size: 12px;
          color: #ff8a80;
        }

        .ia-auth-button {
          margin-top: 8px;
          width: 100%;
          padding: 11px 14px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #d94841, #f06c5f);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 16px 40px rgba(217, 72, 65, 0.7);
        }

        .ia-auth-footer-text {
          margin: 0;
          margin-top: 6px;
          font-size: 12px;
          text-align: center;
          opacity: 0.82;
        }

        .ia-auth-link {
          color: #f6e7b8;
          text-decoration: none;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .ia-auth-card {
            padding: 18px 16px 18px;
            border-radius: 20px;
          }

          .ia-auth-logo {
            width: 56px;
          }

          .ia-auth-title-block h1 {
            font-size: 18px;
          }

          .ia-auth-title-block p {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}