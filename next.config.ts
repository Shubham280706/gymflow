import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page here is per-user data behind login, so Cache Components (static shell) doesn't apply.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
