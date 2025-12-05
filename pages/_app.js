// pages/_app.js
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import LayoutShell from '../components/LayoutShell';
import SplashScreen from '../components/SplashScreen';

function MyApp({ Component, pageProps }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const content = showSplash ? (
    <SplashScreen />
  ) : (
    <Component {...pageProps} />
  );

  return <LayoutShell>{content}</LayoutShell>;
}

export default MyApp;