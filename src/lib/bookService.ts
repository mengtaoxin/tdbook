import { ensureBookCached, type CacheProgress } from './cacheIngest';
import { getBookCacheMeta, getCachedBlobUrl, putMeta, type BookCacheMeta } from './cacheStore';
import type { BookListItem, BookRecord } from './bookTypes';
import { bookTypeOf, getBookConfigs, optionalCoverUrl, type BookConfig } from './catalog';
import { getFormatAdapter } from './formats';
import { isSafeSegment } from './paths';

function resolveCoverUrl(config: BookConfig, extracted: string | null): string | null {
  return optionalCoverUrl(config.hover) ?? extracted;
}

async function coverFromSnapshot(config: BookConfig, meta: BookCacheMeta): Promise<string | null> {
  let coverPath = meta.coverPath;
  if (coverPath === undefined) {
    try {
      const adapter = getFormatAdapter(bookTypeOf(config));
      const snap = await adapter.snapshot(config.path);
      if (snap) {
        const next: BookCacheMeta = {
          ...meta,
          pageCount: snap.pageCount,
          coverPath: snap.coverPath,
        };
        await putMeta(next);
        coverPath = snap.coverPath;
      }
    } catch {
      return null;
    }
  }
  if (!coverPath) return null;
  return getCachedBlobUrl(config.path, coverPath);
}

export async function getBook(
  id: string,
  onProgress?: (progress: CacheProgress) => void,
): Promise<BookRecord | null> {
  if (!isSafeSegment(id)) return null;

  const { books: configs } = await getBookConfigs();
  const config = configs.find((book) => book.id === id);
  if (!config) return null;

  const adapter = getFormatAdapter(bookTypeOf(config));

  try {
    await ensureBookCached(config.path, {
      type: adapter.type,
      catalogId: config.id,
      ingest: (sourceUrl, blob, progress) => adapter.ingest(sourceUrl, blob, progress),
      snapshot: (sourceUrl) => adapter.snapshot(sourceUrl),
      onProgress,
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('errors.cacheBookFailed');
  }

  const record = await adapter.open(id, config);
  if (!record) return null;
  record.coverUrl = resolveCoverUrl(config, record.coverUrl);
  return record;
}

export type BookListResult = {
  books: BookListItem[];
  duplicateIds: string[];
};

export async function listBooks(): Promise<BookListResult> {
  const { books: configs, duplicateIds } = await getBookConfigs();

  const books = await Promise.all(
    configs.map(async (config) => {
      const type = bookTypeOf(config);
      const meta = await getBookCacheMeta(config.path);
      const cached = Boolean(meta);
      let extractedCover: string | null = null;

      if (!optionalCoverUrl(config.hover) && meta) {
        try {
          extractedCover = await coverFromSnapshot(config, meta);
        } catch {
          extractedCover = null;
        }
      }

      return {
        id: config.id,
        type,
        title: config.title,
        author: (config.author ?? '').trim(),
        sourceUrl: config.path,
        cached,
        coverUrl: resolveCoverUrl(config, extractedCover),
      };
    }),
  );

  return { books, duplicateIds };
}
