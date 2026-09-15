import {
  cancelEnsureInFlight,
  clearEnsureInFlight,
  ensureBookCached,
  type CacheProgress,
} from './cacheIngest'
import {
  clearAllCacheRecords,
  deleteBookCacheRecords,
  getCachedBlobUrl,
  getCachedFile,
  isBookCached,
  listBlobUrlEntries,
  PDF_FILE_KEY,
  peekBlobUrl,
  pdfCacheRelativePath,
  readCachedText,
  type BookCacheMeta,
} from './cacheStore'
import { unloadPdfDocument } from './pdfReader'

export type { BookCacheMeta, CacheProgress }
export type { BookType } from './bookTypes'
export {
  ensureBookCached,
  getCachedBlobUrl,
  getCachedFile,
  isBookCached,
  pdfCacheRelativePath,
  readCachedText,
}

function unloadCachedPdfDocuments(predicate: (key: string) => boolean) {
  const pdfSuffix = `\0${PDF_FILE_KEY}`
  for (const [key, url] of listBlobUrlEntries()) {
    if (predicate(key) && key.endsWith(pdfSuffix)) {
      unloadPdfDocument(url)
    }
  }
}

export async function clearBookCache(sourceUrl: string): Promise<void> {
  const pdfUrl = peekBlobUrl(sourceUrl, PDF_FILE_KEY)
  if (pdfUrl) {
    unloadPdfDocument(pdfUrl)
  }

  cancelEnsureInFlight(sourceUrl)
  await deleteBookCacheRecords(sourceUrl)
}

/** Clears IndexedDB cache and in-memory blob URLs for every book. */
export async function clearAllBookCaches(): Promise<void> {
  unloadCachedPdfDocuments(() => true)
  clearEnsureInFlight()
  await clearAllCacheRecords()
}
