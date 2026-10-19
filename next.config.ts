import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the explicit demo's mobile navigation clear of the development badge.
  devIndicators: process.env.MARKETER_DEMO_ENABLED === "true" ? false : undefined,
};

export default nextConfig;
