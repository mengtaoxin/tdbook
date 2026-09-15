import JSZip from 'jszip'
import type { BookType } from './bookTypes'
import {
  isBookCached,
  PDF_FILE_KEY,
  putFiles,
  putMeta,
  type BookCacheMeta,
} from './cacheStore'

export type CacheProgress = {
  phase: 'download' | 'extract' | 'done'
  loaded: number
  total: number | null
}

const ensureInFlight = new Map<string, Promise<void>>()

function guessMime(path: string): string {
  const lower = path.toLowerCase()
  if (lower.endsWith('.html') || lower.endsWith('.xhtml') || lower.endsWith('.htm')) {
    return 'application/xhtml+xml'
  }
  if (lower.endsWith('.css')) return 'text/css'
  if (lower.endsWith('.xml') || lower.endsWith('.opf') || lower.endsWith('.ncx')) {
    return 'application/xml'
  }
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.woff')) return 'font/woff'
  if (lower.endsWith('.woff2')) return 'font/woff2'
  if (lower.endsWith('.ttf')) return 'font/ttf'
  if (lower.endsWith('.otf')) return 'font/otf'
  return 'application/octet-stream'
}

async function fetchAsBlob(
  sourceUrl: string,
  onProgress?: (progress: CacheProgress) => void,
): Promise<Blob> {
  // Remote hosts must allow CORS for browser fetch.
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`下载失败（HTTP ${response.status}）。`)
  }

  const totalHeader = response.headers.get('Content-Length')
  const total = totalHeader ? Number.parseInt(totalHeader, 10) : null
  const body = response.body
  if (!body || total == null || !Number.isFinite(total)) {
    const blob = await response.blob()
    onProgress?.({ phase: 'download', loaded: blob.size, total: blob.size })
    return blob
  }

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      loaded += value.byteLength
      onProgress?.({ phase: 'download', loaded, total })
    }
  }

  const merged = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new Blob([merged], {
    type: response.headers.get('Content-Type') ?? 'application/octet-stream',
  })
}

export async function extractEpubToCache(
  sourceUrl: string,
  zipBlob: Blob,
  onProgress?: (progress: CacheProgress) => void,
) {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(zipBlob)
  } catch {
    throw new Error('无法解压 EPUB（文件可能已损坏或不是有效的 zip）。')
  }

  const fileEntries = Object.values(zip.files).filter((entry) => !entry.dir)
  const total = fileEntries.length
  const batch: Array<{ relativePath: string; blob: Blob }> = []
  let loaded = 0

  for (const entry of fileEntries) {
    const relativePath = entry.name.replace(/^\/+/, '')
    if (!relativePath || relativePath.endsWith('/')) continue
    const data = await entry.async('uint8array')
    const copy = new Uint8Array(data)
    batch.push({
      relativePath,
      blob: new Blob([copy], { type: guessMime(relativePath) }),
    })
    loaded += 1
    onProgress?.({ phase: 'extract', loaded, total })

    if (batch.length >= 32) {
      await putFiles(sourceUrl, batch)
      batch.length = 0
    }
  }

  if (batch.length) {
    await putFiles(sourceUrl, batch)
  }
}

async function downloadAndStore(
  sourceUrl: string,
  type: BookType,
  catalogId: string,
  onProgress?: (progress: CacheProgress) => void,
) {
  const blob = await fetchAsBlob(sourceUrl, onProgress)

  if (type === 'pdf') {
    await putFiles(sourceUrl, [{ relativePath: PDF_FILE_KEY, blob }])
  } else {
    await extractEpubToCache(sourceUrl, blob, onProgress)
  }

  const meta: BookCacheMeta = {
    sourceUrl,
    type,
    id: catalogId,
    status: 'ready',
    downloadedAt: Date.now(),
  }
  await putMeta(meta)
  onProgress?.({ phase: 'done', loaded: 1, total: 1 })
}

export async function ensureBookCached(
  sourceUrl: string,
  type: BookType,
  onProgress?: (progress: CacheProgress) => void,
  catalogId?: string,
): Promise<void> {
  if (await isBookCached(sourceUrl)) {
    onProgress?.({ phase: 'done', loaded: 1, total: 1 })
    return
  }

  const id = catalogId ?? sourceUrl
  let pending = ensureInFlight.get(sourceUrl)
  if (!pending) {
    pending = downloadAndStore(sourceUrl, type, id, onProgress).finally(() => {
      ensureInFlight.delete(sourceUrl)
    })
    ensureInFlight.set(sourceUrl, pending)
  }
  await pending
}

export function cancelEnsureInFlight(sourceUrl: string) {
  ensureInFlight.delete(sourceUrl)
}

export function clearEnsureInFlight() {
  ensureInFlight.clear()
}
