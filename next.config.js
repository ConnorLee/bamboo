/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/halo-site/index.html" },
        { source: "/how-it-works", destination: "/halo-site/how-it-works/index.html" },
        { source: "/original", destination: "/halo-site/original/index.html" },
      ],
    }
  },
  // Existing demo routes retain their legacy lint policy.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
