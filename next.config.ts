import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const PAGES_INTERNALS = ["_app", "_document", "_error"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // App Router only: NFT still looks at Pages internals. Pin the root so
  // Windows paths do not drift outside the project during Collecting build traces.
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Sin backend ni datos de terceros que cargar: una CSP estricta no rompe nada aquí.
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  },
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
