import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllCacheRecords,
  getCachedFile,
  getBookCacheMeta,
  isBookCached,
  resetBlobUrlCacheForTests,
  resetCacheDbForTests,
} from '@/lib/cacheStore';

const LEGACY_DB = 'tdbook-cache';

function openLegacyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LEGACY_DB, 1);
    request.onerror = () => reject(request.error ?? new Error('open failed'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'sourceUrl' });
      }
      if (!db.objectStoreNames.contains('files')) {
        const files = db.createObjectStore('files', { keyPath: ['sourceUrl', 'relativePath'] });
        files.createIndex('sourceUrl', 'sourceUrl', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('idb request failed'));
  });
}

function deleteLegacyDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(LEGACY_DB);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('delete failed'));
    request.onblocked = () => resolve();
  });
}

async function seedLegacyCache() {
  const db = await openLegacyDb();
  try {
    const tx = db.transaction(['meta', 'files'], 'readwrite');
    await idbReq(
      tx.objectStore('meta').put({
        sourceUrl: 'https://example.com/legacy.epub',
        type: 'epub',
        id: 'legacy',
        status: 'ready',
        downloadedAt: 1_700_000_000_000,
        pageCount: 2,
        coverPath: 'OEBPS/cover.png',
      }),
    );
    await idbReq(
      tx.objectStore('files').put({
        sourceUrl: 'https://example.com/legacy.epub',
        relativePath: 'OEBPS/cover.png',
        blob: new Blob(['cover-bytes'], { type: 'image/png' }),
      }),
    );
    await idbReq(
      tx.objectStore('files').put({
        sourceUrl: 'https://example.com/legacy.epub',
        relativePath: 'OEBPS/ch1.xhtml',
        blob: new Blob(['chapter'], { type: 'application/xhtml+xml' }),
      }),
    );
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('tx failed'));
    });
  } finally {
    db.close();
  }
}

function legacyDbExists(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LEGACY_DB);
    request.onerror = () => reject(request.error ?? new Error('exists check failed'));
    request.onsuccess = () => {
      const db = request.result;
      const exists = db.objectStoreNames.contains('meta');
      db.close();
      // Opening creates an empty DB when missing; delete empty shells so existence is meaningful.
      if (!exists) {
        void deleteLegacyDb().then(() => resolve(false), reject);
        return;
      }
      resolve(true);
    };
  });
}

describe('IndexedDB → SQLite cache migration', () => {
  beforeEach(async () => {
    resetBlobUrlCacheForTests();
    await resetCacheDbForTests();
    await deleteLegacyDb();
    await clearAllCacheRecords();
    await deleteLegacyDb();
  });

  it('copies legacy Dexie rows into SQLite and drops the IndexedDB database', async () => {
    await seedLegacyCache();
    expect(await legacyDbExists()).toBe(true);

    const sourceUrl = 'https://example.com/legacy.epub';
    expect(await isBookCached(sourceUrl)).toBe(true);
    expect(await getBookCacheMeta(sourceUrl)).toEqual({
      sourceUrl,
      type: 'epub',
      id: 'legacy',
      status: 'ready',
      downloadedAt: 1_700_000_000_000,
      pageCount: 2,
      coverPath: 'OEBPS/cover.png',
    });
    expect(await (await getCachedFile(sourceUrl, 'OEBPS/ch1.xhtml'))?.text()).toBe('chapter');
    expect(await (await getCachedFile(sourceUrl, 'OEBPS/cover.png'))?.type).toBe('image/png');

    expect(await legacyDbExists()).toBe(false);
  });
});
