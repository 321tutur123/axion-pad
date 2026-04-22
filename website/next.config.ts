import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.125"],
  experimental: {
    optimizePackageImports: ["three", "@react-three/fiber", "@react-three/drei", "gsap"],
  },
  turbopack: {},
  async rewrites() {
    // fallback: Next.js API routes are checked first; only unmatched paths are proxied
    return {
      fallback: [
        { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      ],
    };
  },
};

export default nextConfig;
