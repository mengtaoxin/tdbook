import type { BookType } from './bookTypes'
import { epubAdapter } from './epubFormat'
import type { FormatAdapter } from './formatAdapter'
import { pdfAdapter } from './pdfFormat'

const adapters: Record<BookType, FormatAdapter> = {
  epub: epubAdapter,
  pdf: pdfAdapter,
}

export function getFormatAdapter(type: BookType): FormatAdapter {
  return adapters[type]
}

export type { FormatAdapter, PageContent } from './formatAdapter'
