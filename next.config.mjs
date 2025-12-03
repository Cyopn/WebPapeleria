/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'noninitial-chirurgical-judah.ngrok-free.dev',
        port: '',
        pathname: '/api/file-manager/**',
      },
    ],
  },
};

export default nextConfig;
