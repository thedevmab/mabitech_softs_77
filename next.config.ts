import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack rooted at this app so Flutter under mobile/ is not a resolve root.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Used when running `next dev --webpack` (see package.json "dev").
  // Flutter rebuilds under mobile/ were triggering endless Fast Refresh loops.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/mobile/**",
          "**/storage/**",
          "**/backups/**",
          "**/.dart_tool/**",
        ],
      };
    }
    return config;
  },
  outputFileTracingExcludes: {
    "*": ["./mobile/**", "./storage/**", "./backups/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
