/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: '50mb',
  },
  allowedDevOrigins: [
    'local-origin.dev',
    '*.local-origin.dev',
  ],
  reactCompiler: true,
  async rewrites() {
    return []
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/api/file-manager/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.43',
        port: '5000',
        pathname: '/api/file-manager/**',
      }
    ],
  },
};

export default nextConfig;
