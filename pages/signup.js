// pages/signup.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const generateUsername = (email) =>
    email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  async function handleSignup(e) {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password) {
      setError('Please fill in your name, email and password.');
      return;
    }

    try {
      setLoading(true);

      // 1) Create auth user
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
        const msg = signUpError.message?.toLowerCase() || '';
        if (msg.includes('already registered')) {
          throw new Error('An account with this email already exists.');
        }
        throw signUpError;
      }

      const user = signUpData?.user;
      if (!user) throw new Error('User not returned from Supabase.');

      // 2) Username
      const username =
        fullName.trim().replace(/\s+/g, '_').toLowerCase() ||
        generateUsername(email);

      // 3) Profile row
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: email.trim(),
          username,
          full_name: fullName,
          role: 'user',
        },
        { onConflict: 'id' }
      );

      if (profileError) {
        const msg = profileError.message?.toLowerCase() || '';
        if (msg.includes('duplicate')) {
          throw new Error('A profile already exists. Please sign in.');
        }
        throw profileError;
      }

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong creating your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-inner">

        {/* HEADER – consistent with login */}
        <header className="signup-header">
          <img src="/ia-logo.png" alt="IA" className="header-logo" />
          <div className="header-text">
            <h1 className="header-title">IMPERIAL ADVOCATES</h1>
            <p className="header-sub">Investor Training &amp; Client Portal</p>
          </div>
        </header>

        {/* CARD */}
        <main className="signup-card">
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

            <button type="submit" className="primary-btn" disabled={loading}>
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
        /* Matches login spacing + safe-area */
        .signup-page {
          min-height: 100vh;
          background: #f5f7fb;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 24px;
        }

        .signup-inner {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .signup-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
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
          letter-spacing: 0.08em;
        }

        .header-sub {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        /* CARD */
        .signup-card {
          background: #ffffff;
          border-radius: 22px;
          padding: 20px 22px 22px;
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

        .primary-btn {
          margin-top: 6px;
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 11px 16px;
          font-size: 15px;
          font-weight: 600;
          background: linear-gradient(135deg, #1d2cff, #0a0f4f);
          color: #ffffff;
          box-shadow: 0 18px 40px rgba(29, 44, 255, 0.25);
        }

        .primary-btn[disabled] {
          opacity: 0.7;
        }

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

        @media (max-width: 720px) {
          .signup-page {
            padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 20px;
          }

          .signup-card {
            padding: 18px 18px 20px;
          }
        }
      `}</style>
    </div>
  );
}