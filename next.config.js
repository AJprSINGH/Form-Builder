/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  showConsole: false,
};
module.exports = {
  reactStrictMode: true,
  compiler: {
    removeConsole: false, // Keep console logs in production
  },
};