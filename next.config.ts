import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  turbopack: {
    root: process.cwd(),
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "zc4kradbuuhn13vi.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
