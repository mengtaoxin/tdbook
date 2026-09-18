import {
  ensureBookCached,
  type CacheProgress,
} from './cacheIngest'
import {
  getCachedBlobUrl,
  isBookCached,
  peekBlobUrl,
  peekBlobUrlsForRelativePath,
  putFiles,
} from './cacheStore'
import type { PdfBookRecord } from './bookTypes'
import type { BookConfig } from './catalog'
import type { FormatAdapter, PageContent } from './formatAdapter'
import { loadPdfDocument, renderPdfCover, unloadPdfDocument } from './pdfReader'

/** IndexedDB relative path for the cached PDF blob. */
export const PDF_CACHE_FILE_KEY = '__pdf__'

async function ingestPdf(sourceUrl: string, blob: Blob, _onProgress?: (progress: CacheProgress) => void) {
  await putFiles(sourceUrl, [{ relativePath: PDF_CACHE_FILE_KEY, blob }])
}

function unloadPdfForSource(sourceUrl: string | null) {
  if (sourceUrl) {
    const pdfUrl = peekBlobUrl(sourceUrl, PDF_CACHE_FILE_KEY)
    if (pdfUrl) unloadPdfDocument(pdfUrl)
    return
  }
  for (const url of peekBlobUrlsForRelativePath(PDF_CACHE_FILE_KEY)) {
    unloadPdfDocument(url)
  }
}

async function loadCachedPdf(sourceUrl: string) {
  const pdfUrl = await getCachedBlobUrl(sourceUrl, PDF_CACHE_FILE_KEY)
  if (!pdfUrl) return null
  const doc = await loadPdfDocument(pdfUrl)
  return { pdfUrl, doc }
}

async function coverFromDoc(
  doc: Awaited<ReturnType<typeof loadPdfDocument>>,
): Promise<string | null> {
  try {
    return await renderPdfCover(doc)
  } catch {
    return null
  }
}

async function openPdf(
  id: string,
  config: BookConfig,
): Promise<PdfBookRecord | null> {
  try {
    const loaded = await loadCachedPdf(config.path)
    if (!loaded) return null

    return {
      id,
      type: 'pdf',
      title: config.title,
      author: '',
      description: '',
      sourceUrl: config.path,
      coverHref: null,
      coverUrl: await coverFromDoc(loaded.doc),
      pdfUrl: loaded.pdfUrl,
      pageCount: loaded.doc.numPages,
    }
  } catch {
    return null
  }
}

export const pdfAdapter: FormatAdapter = {
  type: 'pdf',

  ingest: ingestPdf,

  ensure(sourceUrl, catalogId, onProgress) {
    return ensureBookCached(sourceUrl, {
      type: 'pdf',
      catalogId,
      ingest: ingestPdf,
      onProgress,
    })
  },

  open(id, config) {
    return openPdf(id, config)
  },

  async extractCover(config) {
    if (!(await isBookCached(config.path))) return null
    try {
      const loaded = await loadCachedPdf(config.path)
      if (!loaded) return null
      return await coverFromDoc(loaded.doc)
    } catch {
      return null
    }
  },

  async getPage(book, pageIndex): Promise<PageContent | null> {
    if (book.type !== 'pdf') return null
    if (pageIndex < 0 || pageIndex >= book.pageCount) return null
    return {
      type: 'pdf',
      pageNumber: pageIndex + 1,
      pdfUrl: book.pdfUrl,
    }
  },

  onCacheCleared(sourceUrl) {
    unloadPdfForSource(sourceUrl)
  },
}
