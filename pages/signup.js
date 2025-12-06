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

      // 1️⃣ Create Supabase Auth user
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

      // 2️⃣ Decide username
      const username = fullName
        ? fullName.trim().replace(/\s+/g, '_').toLowerCase()
        : generateUsername(email);

      // 3️⃣ Upsert profile row
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
    <div className="auth-root">
      <div className="auth-shell">
        {/* Top branding header (same as index.js) */}
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
            Create your login to access your NDIS, co-living and rooming house
            training, resources and client updates.
          </p>
        </header>

        {/* Main card – same styling as login, different content */}
        <main className="card">
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

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link href="/" className="link">
              Sign in
            </Link>
          </div>
        </main>
      </div>

      {/* STYLES – copied from index.js so layout matches exactly */}
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