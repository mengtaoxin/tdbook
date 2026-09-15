import {
  ensureBookCached,
  getCachedBlobUrl,
  isBookCached,
  pdfCacheRelativePath,
} from './bookCache'
import type { PdfBookRecord } from './bookTypes'
import type { BookConfig } from './catalog'
import type { FormatAdapter, PageContent } from './formatAdapter'
import { loadPdfDocument, renderPdfCover } from './pdfReader'

async function openPdf(
  id: string,
  config: BookConfig,
): Promise<PdfBookRecord | null> {
  const pdfUrl = await getCachedBlobUrl(config.path, pdfCacheRelativePath())
  if (!pdfUrl) return null

  try {
    const doc = await loadPdfDocument(pdfUrl)

    let extractedCover: string | null = null
    try {
      extractedCover = await renderPdfCover(doc)
    } catch {
      extractedCover = null
    }

    return {
      id,
      type: 'pdf',
      title: config.title,
      author: '',
      description: '',
      sourceUrl: config.path,
      coverHref: null,
      coverUrl: extractedCover,
      pdfUrl,
      pageCount: doc.numPages,
    }
  } catch {
    return null
  }
}

export const pdfAdapter: FormatAdapter = {
  type: 'pdf',

  ensure(sourceUrl, catalogId, onProgress) {
    return ensureBookCached(sourceUrl, 'pdf', onProgress, catalogId)
  },

  open(id, config) {
    return openPdf(id, config)
  },

  async extractCover(config) {
    if (!(await isBookCached(config.path))) return null
    try {
      const pdfUrl = await getCachedBlobUrl(config.path, pdfCacheRelativePath())
      if (!pdfUrl) return null
      const doc = await loadPdfDocument(pdfUrl)
      return await renderPdfCover(doc)
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
}
