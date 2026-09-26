import { type CacheProgress } from './cacheIngest';
import { getCachedBlobUrl, readCachedText } from './cacheStore';
import type { EpubBookRecord } from './bookTypes';
import type { BookConfig } from './catalog';
import { extractEpubToCache } from './epubIngest';
import { parseCachedEpubPackage } from './epubPackage';
import type { EpubPageContent, FormatAdapter, FormatSnapshot } from './formatAdapter';
import { rewritePageHtml } from './rewriteHtml';

async function ingestEpub(
  sourceUrl: string,
  blob: Blob,
  onProgress?: (progress: CacheProgress) => void,
) {
  await extractEpubToCache(sourceUrl, blob, onProgress);
}

async function snapshotEpub(sourceUrl: string): Promise<FormatSnapshot | null> {
  const parsed = await parseCachedEpubPackage(sourceUrl, '');
  if (!parsed) return null;
  return {
    pageCount: parsed.pages.length,
    coverPath: parsed.coverHref,
  };
}

async function openEpub(id: string, config: BookConfig): Promise<EpubBookRecord | null> {
  const parsed = await parseCachedEpubPackage(config.path, config.title);
  if (!parsed) return null;

  const extractedCover = parsed.coverHref
    ? await getCachedBlobUrl(config.path, parsed.coverHref)
    : null;

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
  };
}

async function readPageSource(book: EpubBookRecord, pageIndex: number) {
  const page = book.pages[pageIndex];
  if (!page) return null;
  return readCachedText(book.sourceUrl, page.href);
}

export const epubAdapter: FormatAdapter<EpubBookRecord, EpubPageContent> = {
  type: 'epub',

  ingest: ingestEpub,
  snapshot: snapshotEpub,

  open(id, config) {
    return openEpub(id, config);
  },

  pageCount(book) {
    return book.pages.length;
  },

  async getPage(book, pageIndex): Promise<EpubPageContent | null> {
    const source = await readPageSource(book, pageIndex);
    if (source == null) return null;
    const current = book.pages[pageIndex];
    if (!current) return null;
    const rewritten = await rewritePageHtml(source, book, current.href, book.pages);
    return { type: 'epub', rewritten };
  },
};
