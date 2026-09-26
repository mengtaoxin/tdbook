import { cancelEnsureInFlight, clearEnsureInFlight, type CacheProgress } from './cacheIngest';
import { notifyFormatCacheCleared } from './formats';
import {
  clearAllCacheRecords,
  deleteBookCacheRecords,
  getCachedBlobUrl,
  getCachedFile,
  isBookCached,
  readCachedText,
  type BookCacheMeta,
} from './cacheStore';

export type { BookCacheMeta, CacheProgress };
export type { BookType } from './bookTypes';
export { getCachedBlobUrl, getCachedFile, isBookCached, readCachedText };

export async function clearBookCache(sourceUrl: string): Promise<void> {
  notifyFormatCacheCleared(sourceUrl);
  cancelEnsureInFlight(sourceUrl);
  await deleteBookCacheRecords(sourceUrl);
}

/** Clears IndexedDB cache and in-memory blob URLs for every book. */
export async function clearAllBookCaches(): Promise<void> {
  notifyFormatCacheCleared(null);
  clearEnsureInFlight();
  await clearAllCacheRecords();
}
