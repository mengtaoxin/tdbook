import JSZip from 'jszip'
import { putFiles } from './cacheStore'
import type { CacheProgress } from './cacheIngest'

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

/** Unpack an EPUB zip into per-path blobs under `sourceUrl`. */
export async function extractEpubToCache(
  sourceUrl: string,
  zipBlob: Blob,
  onProgress?: (progress: CacheProgress) => void,
) {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(zipBlob)
  } catch {
    throw new Error('errors.epubExtractFailed')
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
