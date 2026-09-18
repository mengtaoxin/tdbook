import type { BookRecord, BookType } from './bookTypes'
import { epubAdapter } from './epubFormat'
import type { FormatAdapter, PageContent } from './formatAdapter'
import { pdfAdapter } from './pdfFormat'

export const formatAdapters = {
  epub: epubAdapter,
  pdf: pdfAdapter,
} as const satisfies { [K in BookType]: FormatAdapter }

export function getFormatAdapter<T extends BookType>(
  type: T,
): (typeof formatAdapters)[T] {
  return formatAdapters[type]
}

export function notifyFormatCacheCleared(sourceUrl: string | null) {
  for (const adapter of Object.values(formatAdapters)) {
    adapter.onCacheCleared?.(sourceUrl)
  }
}

/** Type-narrowing dispatcher so getPage stays format-safe. */
export async function getBookPage(
  book: BookRecord,
  pageIndex: number,
): Promise<PageContent | null> {
  if (book.type === 'epub') return epubAdapter.getPage(book, pageIndex)
  return pdfAdapter.getPage(book, pageIndex)
}

export type { FormatAdapter, FormatSnapshot, PageContent } from './formatAdapter'
