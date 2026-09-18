import {
  ensureBookCached,
  type CacheProgress,
} from './cacheIngest'
import {
  getCachedBlobUrl,
  isBookCached,
  readCachedText,
} from './cacheStore'
import type { EpubBookRecord } from './bookTypes'
import type { BookConfig } from './catalog'
import { extractEpubToCache } from './epubIngest'
import { parseCachedEpubPackage } from './epubPackage'
import type { FormatAdapter, PageContent } from './formatAdapter'
import { rewritePageHtml } from './rewriteHtml'

async function ingestEpub(
  sourceUrl: string,
  blob: Blob,
  onProgress?: (progress: CacheProgress) => void,
) {
  await extractEpubToCache(sourceUrl, blob, onProgress)
}

async function openEpub(
  id: string,
  config: BookConfig,
): Promise<EpubBookRecord | null> {
  const parsed = await parseCachedEpubPackage(config.path, config.title)
  if (!parsed) return null

  const extractedCover = parsed.coverHref
    ? await getCachedBlobUrl(config.path, parsed.coverHref)
    : null

  return {
    id,
    type: 'epub',
    title: parsed.title,
    author: parsed.author,
    description: parsed.description,
    sourceUrl: config.path,
    opfDir: parsed.opfDir,
    coverHref: parsed.coverHref,
    coverUrl: extractedCover,
    pages: parsed.pages,
    stylesheetHrefs: parsed.stylesheetHrefs,
  }
}

async function readPageSource(book: EpubBookRecord, pageIndex: number) {
  const page = book.pages[pageIndex]
  if (!page) return null
  return readCachedText(book.sourceUrl, page.href)
}

export const epubAdapter: FormatAdapter = {
  type: 'epub',

  ingest: ingestEpub,

  ensure(sourceUrl, catalogId, onProgress) {
    return ensureBookCached(sourceUrl, {
      type: 'epub',
      catalogId,
      ingest: ingestEpub,
      onProgress,
    })
  },

  open(id, config) {
    return openEpub(id, config)
  },

  async extractCover(config) {
    if (!(await isBookCached(config.path))) return null
    const parsed = await parseCachedEpubPackage(config.path, config.title)
    if (!parsed?.coverHref) return null
    return getCachedBlobUrl(config.path, parsed.coverHref)
  },

  async getPage(book, pageIndex): Promise<PageContent | null> {
    if (book.type !== 'epub') return null
    const source = await readPageSource(book, pageIndex)
    if (source == null) return null
    const current = book.pages[pageIndex]
    if (!current) return null
    const rewritten = await rewritePageHtml(
      source,
      book,
      current.href,
      book.pages,
    )
    return { type: 'epub', rewritten }
  },
}
