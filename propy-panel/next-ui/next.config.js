/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_PATH: process.env.API_PATH || "http://127.0.0.1:8084",
    SITE_URL: process.env.SITE_URL || "http://127.0.0.1:3000",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  },
};

module.exports = nextConfig;
