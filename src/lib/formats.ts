import type { BookType } from './bookTypes'
import { registerCacheClearHook } from './cacheHooks'
import { epubAdapter } from './epubFormat'
import type { FormatAdapter } from './formatAdapter'
import { pdfAdapter } from './pdfFormat'

const adapters: Record<BookType, FormatAdapter> = {
  epub: epubAdapter,
  pdf: pdfAdapter,
}

for (const adapter of Object.values(adapters)) {
  registerCacheClearHook(adapter.type, (sourceUrl) => {
    adapter.onCacheCleared?.(sourceUrl)
  })
}

export function getFormatAdapter(type: BookType): FormatAdapter {
  return adapters[type]
}

export type { FormatAdapter, PageContent } from './formatAdapter'
