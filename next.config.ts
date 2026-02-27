import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol:"http",
        hostname:"192.168.2.249",
        pathname:"/**"
      },
      {
        protocol:"https",
        hostname:"test.niceitsolution.com"
      }
    ]
  }
};

export default nextConfig;
