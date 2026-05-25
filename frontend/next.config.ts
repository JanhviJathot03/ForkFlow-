import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy /api/* to the backend in dev so there are no CORS issues
  // and the browser never makes cross-origin requests.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:5000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
