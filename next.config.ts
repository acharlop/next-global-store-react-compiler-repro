import { realpathSync } from "node:fs";
import type { NextConfig } from "next";

// With the global virtual store, node_modules/next is a symlink to <store>/links/next/<version>/<hash>/node_modules/next.
const pnpmGlobalStore = realpathSync("node_modules/next").split("/links/")[0];

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    turbopackAdditionalRoots: { pnpm: { path: pnpmGlobalStore } },
  },
};

export default nextConfig;
