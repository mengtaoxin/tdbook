import type { CacheProgress } from './cacheIngest'
import type { BookRecord, BookType } from './bookTypes'
import type { BookConfig } from './catalog'
import type { RewrittenPage } from './rewriteHtml'

export type EpubPageContent = {
  type: 'epub'
  rewritten: RewrittenPage
}

export type PdfPageContent = {
  type: 'pdf'
  pageNumber: number
  pdfUrl: string
}

export type PageContent = EpubPageContent | PdfPageContent

/**
 * Per-format pipeline: ingest blob → assemble BookRecord → page content.
 * Cover extraction is separate so the book list can stay lighter than a full open.
 */
export type FormatAdapter = {
  readonly type: BookType
  ingest(
    sourceUrl: string,
    blob: Blob,
    onProgress?: (progress: CacheProgress) => void,
  ): Promise<void>
  ensure(
    sourceUrl: string,
    catalogId: string,
    onProgress?: (progress: CacheProgress) => void,
  ): Promise<void>
  open(id: string, config: BookConfig): Promise<BookRecord | null>
  /** Package/cover bitmap when cached; caller applies `hover` override. */
  extractCover(config: BookConfig): Promise<string | null>
  /** `pageIndex` is 0-based. */
  getPage(book: BookRecord, pageIndex: number): Promise<PageContent | null>
  /** Called before IndexedDB/blob URLs for this source (or all) are dropped. */
  onCacheCleared?(sourceUrl: string | null): void
}
