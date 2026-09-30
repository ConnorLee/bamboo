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
  async headers() {
    return [
      {
        source: "/variants/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/halo-site/index.html" },
        { source: "/how-it-works", destination: "/halo-site/how-it-works/index.html" },
        { source: "/original", destination: "/halo-site/original/index.html" },
        { source: "/variants", destination: "/halo-site/variants/index.html" },
        { source: "/variants/a", destination: "/halo-site/variants/a/index.html" },
        { source: "/variants/b", destination: "/halo-site/variants/b/index.html" },
        { source: "/variants/c", destination: "/halo-site/variants/c/index.html" },
        { source: "/variants/d", destination: "/halo-site/variants/d/index.html" },
      ],
    }
  },
  // Existing demo routes retain their legacy lint policy.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
