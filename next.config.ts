import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The atlas shell is rendered at the edge so the Worker can apply document
  // security headers. Its research application remains a client-only lazy chunk.
};

export default nextConfig;
