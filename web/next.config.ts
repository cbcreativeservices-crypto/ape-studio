import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The web app is self-contained under /web (it does not import from ../shared),
  // so pin the workspace root to this directory. This keeps file tracing correct
  // and avoids "turbopack root is outside the Root Directory" when the Vercel
  // project Root Directory is set to `web/`.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
