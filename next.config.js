// next.config.js

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Still disable PWA in dev so it doesn't get in your way
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 👇 This tells Next 16 "yes, I'm intentionally using Turbopack"
  // and silences the error about having webpack config (from next-pwa)
  // without a turbopack config.
  turbopack: {},
};

module.exports = withPWA(nextConfig);