import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: false, // For easier canvas context and three.js lifecycle
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
