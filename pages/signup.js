// pages/signup.js
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  // Fallback username generator
  const generateUsername = (email) => {
    return email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Create Supabase Auth User
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error("User not returned from Supabase.");

      // 2️⃣ Decide username
      const username = fullName
        ? fullName.trim().replace(/\s+/g, '_').toLowerCase()
        : generateUsername(email);

      // 3️⃣ Insert into profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email,
        username,
        full_name: fullName || null,
        role: 'user',
      });

      if (profileError) throw profileError;

      // 4️⃣ Redirect
      router.push('/dashboard');
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="signup-container">
      <h1>Create your account</h1>

      <form onSubmit={handleSignup}>
        <label>Full name</label>
        <input
          type="text"
          placeholder="Akshat Sharma"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <style jsx>{`
        .signup-container {
          max-width: 420px;
          margin: 60px auto;
          padding: 24px;
          color: #fff;
        }

        input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: none;
          margin-bottom: 16px;
        }

        button {
          width: 100%;
          padding: 12px;
          background: #0a147c;
          border-radius: 8px;
          border: none;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}