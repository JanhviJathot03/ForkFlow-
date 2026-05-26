import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy /api/* to the backend in dev so there are no CORS issues
  // and the browser never makes cross-origin requests.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${(process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000/api").replace(/\/api\/?$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
