/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['http://localhost:3000', 'https://blocktype.cl', 'blocktype.cl'],
}

export default nextConfig
