/** @type {import('next').NextConfig} */
const withPwa = require("next-pwa")({
  dest: "public",
  // Stale SW caches break dev HMR and cause blank pages after rebuilds.
  disable: process.env.NODE_ENV === "development",
});
const nextConfig = withPwa({
  reactStrictMode: true,
});

module.exports = nextConfig;
