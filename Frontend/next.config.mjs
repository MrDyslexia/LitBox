/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'provider.blocktype.cl' },
      { protocol: 'http', hostname: 'localhost', port: '3001' },
    ],
  },
  allowedDevOrigins: ['http://localhost:3000', 'https://blocktype.cl', 'blocktype.cl'],
}

export default nextConfig
