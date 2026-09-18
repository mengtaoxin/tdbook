import type { CacheProgress } from './cacheIngest'
import type { BookRecord } from './bookTypes'
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

/** List/open metadata written after format ingest (optional fields on cache meta). */
export type FormatSnapshot = {
  pageCount: number
  /** Cached cover file path, or null when the package has no cover. */
  coverPath: string | null
}

/**
 * Per-format pipeline: ingest blob → snapshot meta → assemble BookRecord → page content.
 * `TBook` / `TPage` stay aligned so callers do not type-narrow inside the adapter.
 */
export type FormatAdapter<
  TBook extends BookRecord = BookRecord,
  TPage extends PageContent = PageContent,
> = {
  readonly type: TBook['type']
  ingest(
    sourceUrl: string,
    blob: Blob,
    onProgress?: (progress: CacheProgress) => void,
  ): Promise<void>
  /** After files are stored, derive page count and cover path for the list. */
  snapshot(sourceUrl: string): Promise<FormatSnapshot | null>
  open(id: string, config: BookConfig): Promise<TBook | null>
  pageCount(book: TBook): number
  /** `pageIndex` is 0-based. */
  getPage(book: TBook, pageIndex: number): Promise<TPage | null>
  /** Called before IndexedDB/blob URLs for this source (or all) are dropped. */
  onCacheCleared?(sourceUrl: string | null): void
}
