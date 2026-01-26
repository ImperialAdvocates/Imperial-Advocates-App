// pages/_app.js
import '../styles/globals.css';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LayoutShell from '../components/LayoutShell';
import SplashScreen from '../components/SplashScreen';

function MyApp({ Component, pageProps }) {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  <Head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
  />
</Head>

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;

  // Only these pages have NO nav/topbar
  const authRoutes = ['/', '/signup'];
  const isAuthPage = authRoutes.includes(router.pathname);

  if (isAuthPage) {
    return <Component {...pageProps} />;
  }

  return (
    <LayoutShell>
      <Component {...pageProps} />
    </LayoutShell>
  );
}

export default MyApp;