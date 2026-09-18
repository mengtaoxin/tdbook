import { type CacheProgress } from './cacheIngest'
import {
  getBookCacheMeta,
  getCachedBlobUrl,
  peekBlobUrl,
  peekBlobUrlsForRelativePath,
  putFiles,
} from './cacheStore'
import type { PdfBookRecord } from './bookTypes'
import type { BookConfig } from './catalog'
import type {
  FormatAdapter,
  FormatSnapshot,
  PdfPageContent,
} from './formatAdapter'
import { loadPdfDocument, renderPdfCover, unloadPdfDocument } from './pdfReader'

/** IndexedDB relative path for the cached PDF blob. */
export const PDF_CACHE_FILE_KEY = '__pdf__'

/** Snapshot cover rendered from page 1. */
export const PDF_COVER_CACHE_FILE_KEY = '__cover__'

async function ingestPdf(
  sourceUrl: string,
  blob: Blob,
  _onProgress?: (progress: CacheProgress) => void,
) {
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

async function coverBlobFromDoc(
  doc: Awaited<ReturnType<typeof loadPdfDocument>>,
): Promise<Blob | null> {
  try {
    const dataUrl = await renderPdfCover(doc)
    if (!dataUrl) return null
    const response = await fetch(dataUrl)
    if (!response.ok) return null
    return response.blob()
  } catch {
    return null
  }
}

async function snapshotPdf(sourceUrl: string): Promise<FormatSnapshot | null> {
  const loaded = await loadCachedPdf(sourceUrl)
  if (!loaded) return null

  const coverBlob = await coverBlobFromDoc(loaded.doc)
  if (coverBlob) {
    await putFiles(sourceUrl, [
      { relativePath: PDF_COVER_CACHE_FILE_KEY, blob: coverBlob },
    ])
  }

  return {
    pageCount: loaded.doc.numPages,
    coverPath: coverBlob ? PDF_COVER_CACHE_FILE_KEY : null,
  }
}

async function coverUrlForPdf(sourceUrl: string): Promise<string | null> {
  const meta = await getBookCacheMeta(sourceUrl)
  if (meta?.coverPath) {
    return getCachedBlobUrl(sourceUrl, meta.coverPath)
  }
  try {
    const loaded = await loadCachedPdf(sourceUrl)
    if (!loaded) return null
    return await renderPdfCover(loaded.doc)
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
      coverUrl: await coverUrlForPdf(config.path),
      pdfUrl: loaded.pdfUrl,
      pageCount: loaded.doc.numPages,
    }
  } catch {
    return null
  }
}

export const pdfAdapter: FormatAdapter<PdfBookRecord, PdfPageContent> = {
  type: 'pdf',

  ingest: ingestPdf,
  snapshot: snapshotPdf,

  open(id, config) {
    return openPdf(id, config)
  },

  pageCount(book) {
    return book.pageCount
  },

  async getPage(book, pageIndex): Promise<PdfPageContent | null> {
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
