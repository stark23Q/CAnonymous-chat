import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // Proxy to the backend port on localhost
        destination: "http://127.0.0.1:4000/api/:path*"
      }
    ];
  }
};

export default nextConfig;
