import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Monorepo: the web app and the mobile app live under one repo and the web
  // app resolves shared brand code from ../shared. Pin the workspace root to
  // the repo root so file tracing and lockfile detection are unambiguous.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
