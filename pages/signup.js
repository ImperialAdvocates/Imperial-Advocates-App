// pages/signup.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple fallback username generator
  const generateUsername = (email) =>
    email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

  async function handleSignup(e) {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password) {
      setError('Please fill in your name, email and password.');
      return;
    }

    try {
      setLoading(true);

      // 1) Create Supabase Auth user
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

      if (signUpError) {
        if (
          typeof signUpError.message === 'string' &&
          signUpError.message.toLowerCase().includes('already registered')
        ) {
          throw new Error(
            'An account with this email already exists. Please sign in instead.'
          );
        }
        throw signUpError;
      }

      const user = signUpData?.user;
      if (!user) {
        throw new Error('User not returned from Supabase.');
      }

      // 2) Decide username
      const username = fullName
        ? fullName.trim().replace(/\s+/g, '_').toLowerCase()
        : generateUsername(email);

      // 3) Upsert profile row
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: email.trim(),
            username,
            full_name: fullName || null,
            role: 'user',
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        if (
          profileError.code === '23505' ||
          (profileError.message || '').toLowerCase().includes('duplicate')
        ) {
          throw new Error(
            'A profile with this email already exists. Please sign in instead.'
          );
        }
        throw profileError;
      }

      // Success → go to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err.message || 'Something went wrong while creating your account.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-inner">
        {/* IA Header – same as login */}
        <header className="login-header">
          <img src="/ia-logo.png" alt="IA" className="header-logo" />
          <div className="header-text">
            <h1 className="header-title">IMPERIAL ADVOCATES</h1>
            <p className="header-sub">Investor Training &amp; Client Portal</p>
          </div>
        </header>

        {/* Card – same shell as login, different copy/fields */}
        <main className="login-card">
          <h2 className="card-title">Create your account</h2>
          <p className="card-subtitle">
            Enter your details to create your Imperial Advocates portal login.
          </p>

          <form onSubmit={handleSignup} className="form">
            <label className="field-label">Full name</label>
            <input
              className="field-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Akshat Sharma"
            />

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
            />

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <div className="footer-row">
            <span>Already have an account?</span>
            <Link href="/" className="footer-link">
              Sign in
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

        /* HEADER — matches login/dashboard */
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

        /* INPUTS */
        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

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

        /* BUTTON — same gradient as login */
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
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.35);
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