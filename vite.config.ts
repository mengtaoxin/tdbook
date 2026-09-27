import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaManifest } from './src/lib/pwaManifest.ts';

const webRoot = path.dirname(fileURLToPath(import.meta.url));

const MIME: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
};

const PDFJS_ASSETS = ['cmaps', 'standard_fonts', 'wasm', 'iccs'] as const;
const pdfjsRoot = path.join(webRoot, 'node_modules', 'pdfjs-dist');

function isInsideDir(root: string, target: string) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolvePdfjsAsset(urlPath: string): string | null {
  const pathname = decodeURIComponent(urlPath.split('?')[0] ?? '');
  if (!pathname.startsWith('/pdfjs/')) {
    return null;
  }
  const rest = pathname.slice('/pdfjs/'.length);
  const kind = rest.split('/')[0] ?? '';
  if (!PDFJS_ASSETS.includes(kind as (typeof PDFJS_ASSETS)[number])) {
    return null;
  }
  const target = path.resolve(pdfjsRoot, rest);
  if (!isInsideDir(path.join(pdfjsRoot, kind), target)) {
    return null;
  }
  return target;
}

function sendFile(filePath: string, res: ServerResponse, next: (err?: unknown) => void) {
  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      next();
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(filePath).pipe(res);
  });
}

function pdfjsAssetsPlugin(): Plugin {
  const middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    if (!req.url || req.method !== 'GET') {
      next();
      return;
    }
    const filePath = resolvePdfjsAsset(req.url);
    if (!filePath) {
      next();
      return;
    }
    sendFile(filePath, res, next);
  };

  return {
    name: 'pdfjs-assets',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
    writeBundle(options) {
      const outDir = options.dir ?? path.join(webRoot, 'dist');
      for (const asset of PDFJS_ASSETS) {
        const src = path.join(pdfjsRoot, asset);
        if (!fs.existsSync(src)) continue;
        fs.cpSync(src, path.join(outDir, 'pdfjs', asset), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    pdfjsAssetsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      // Keep SW off in `npm run dev` so Playwright e2e stays stable.
      injectRegister: false,
      includeAssets: [
        'favicon.svg',
        'icons/pwa-192.png',
        'icons/pwa-512.png',
        'icons/pwa-512-maskable.png',
      ],
      manifest: pwaManifest,
      workbox: {
        // Include mjs (pdf.js worker) and json (public/configs.json)
        // so a production install can boot offline and reopen cached books.
        globPatterns: ['**/*.{js,mjs,css,html,ico,svg,png,woff2,webmanifest,json}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/configs\.json$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'configs-json',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /\/pdfjs\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdfjs-assets',
              expiration: {
                maxEntries: 256,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.join(webRoot, 'src'),
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: [webRoot],
    },
  },
});
