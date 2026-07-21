import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The atlas is a browser-side research application. Exporting the shell as a
  // static asset keeps Cloudflare Workers out of the critical request path.
  output: "export",
};

export default nextConfig;
