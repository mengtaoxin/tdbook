import type { CacheProgress } from './bookCache'
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
 * Per-format pipeline: cache → assemble BookRecord → page content for the reader.
 * Cover extraction is separate so the book list can stay lighter than a full open.
 */
export type FormatAdapter = {
  readonly type: BookType
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
}
