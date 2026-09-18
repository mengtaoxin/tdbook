import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const webRoot = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = webRoot

const MIME: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
}

const PDFJS_ASSETS = ['cmaps', 'standard_fonts', 'wasm', 'iccs'] as const
const pdfjsRoot = path.join(webRoot, 'node_modules', 'pdfjs-dist')

function isInsideDir(root: string, target: string) {
  const relative = path.relative(root, target)
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}

function resolveRepoStatic(urlPath: string): string | null {
  const pathname = decodeURIComponent(urlPath.split('?')[0] ?? '')
  if (pathname === '/configs.json') {
    return path.join(repoRoot, 'configs.json')
  }
  if (pathname.startsWith('/pdfjs/')) {
    const rest = pathname.slice('/pdfjs/'.length)
    const kind = rest.split('/')[0] ?? ''
    if (!PDFJS_ASSETS.includes(kind as (typeof PDFJS_ASSETS)[number])) {
      return null
    }
    const target = path.resolve(pdfjsRoot, rest)
    if (!isInsideDir(path.join(pdfjsRoot, kind), target)) {
      return null
    }
    return target
  }
  return null
}

function sendFile(
  filePath: string,
  res: ServerResponse,
  next: (err?: unknown) => void,
) {
  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      next()
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
    res.setHeader('Cache-Control', 'no-cache')
    fs.createReadStream(filePath).pipe(res)
  })
}

function repoStaticPlugin(): Plugin {
  const middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    if (!req.url || req.method !== 'GET') {
      next()
      return
    }
    const filePath = resolveRepoStatic(req.url)
    if (!filePath) {
      next()
      return
    }
    sendFile(filePath, res, next)
  }

  return {
    name: 'repo-static',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
    writeBundle(options) {
      const outDir = options.dir ?? path.join(webRoot, 'dist')
      fs.copyFileSync(
        path.join(repoRoot, 'configs.json'),
        path.join(outDir, 'configs.json'),
      )
      for (const asset of PDFJS_ASSETS) {
        const src = path.join(pdfjsRoot, asset)
        if (!fs.existsSync(src)) continue
        fs.cpSync(src, path.join(outDir, 'pdfjs', asset), { recursive: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), repoStaticPlugin()],
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
})
