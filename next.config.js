/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  reactCompiler: true,
}

module.exports = nextConfig