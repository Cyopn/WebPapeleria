/** @type {import('next').NextConfig} */
const nextConfig = {
  // allow common local dev origins and the LAN IP so other devices can load /_next/* during dev
  allowedDevOrigins: [
    'local-origin.dev',
    '*.local-origin.dev',
    // LAN device - adjust or add ports as needed
    'http://192.168.1.13',
    'http://192.168.1.13:3000',
    'http://192.168.1.13:5173',
    'http://192.168.1.13:5174',
    'https://192.168.1.13',
    'https://192.168.1.13:3000',
    // your other device/origin that requested /_next/*
    'http://192.168.1.87',
    'http://192.168.1.87:3000',
    'http://192.168.1.87:5173',
    'http://192.168.1.87:5174',
    'https://192.168.1.87',
    'https://192.168.1.87:3000',
  ],
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/file-manager/download/:type/:filehash',
        destination: 'https://noninitial-chirurgical-judah.ngrok-free.dev/api/file-manager/download/:type/:filehash',
      },
    ]
  },
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
