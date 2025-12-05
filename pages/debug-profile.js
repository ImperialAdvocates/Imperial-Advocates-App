// pages/debug-profile.js
import Layout from './layout';
import { useProfile } from '../hooks/useProfile';

export default function DebugProfilePage() {
  const { profile, loading, isAdmin } = useProfile();

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 12 }}>Debug Profile</h1>

        {loading ? (
          <p style={{ opacity: 0.8 }}>Loading profile…</p>
        ) : (
          <>
            <p style={{ opacity: 0.8, marginBottom: 8 }}>
              This is what <code>useProfile()</code> returns:
            </p>
            <pre
              style={{
                background: 'rgba(0,0,0,0.5)',
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(
                {
                  profile,
                  loading,
                  isAdmin,
                },
                null,
                2
              )}
            </pre>
          </>
        )}
      </div>
    </Layout>
  );
}