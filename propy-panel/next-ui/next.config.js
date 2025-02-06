/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,


  images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'nextui.org',
      port: '',
      pathname: '/gradients/**',
      search: '',
    },
  ],
  },

  env : {
    API_PATH : "http://127.0.0.1:8084"
  }
};

module.exports = nextConfig;
