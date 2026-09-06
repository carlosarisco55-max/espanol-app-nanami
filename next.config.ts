import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const PAGES_INTERNALS = ["_app", "_document", "_error"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // App Router only: NFT still looks at Pages internals. Pin the root so
  // Windows paths do not drift outside the project during Collecting build traces.
  outputFileTracingRoot: path.join(__dirname),
  webpack(config, { isServer, dev }) {
    if (isServer && !dev) {
      config.plugins.push({
        apply(compiler: { hooks: { afterEmit: { tap: (name: string, fn: () => void) => void } }; outputPath: string }) {
          compiler.hooks.afterEmit.tap("EnsurePagesRouterNft", () => {
            const pagesDir = path.join(compiler.outputPath, "pages");
            fs.mkdirSync(pagesDir, { recursive: true });
            for (const name of PAGES_INTERNALS) {
              const nft = path.join(pagesDir, `${name}.js.nft.json`);
              if (!fs.existsSync(nft)) {
                fs.writeFileSync(nft, JSON.stringify({ version: 1, files: [] }));
              }
            }
          });
        }
      });
    }
    return config;
  }
};

export default nextConfig;
