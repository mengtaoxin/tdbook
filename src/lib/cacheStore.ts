import type { BookType } from './bookTypes';

export type BookCacheMeta = {
  sourceUrl: string;
  type: BookType;
  /** Catalog identity (configs.json `id`). */
  id: string;
  status: 'ready';
  downloadedAt: number;
  /** Set by format snapshot after ingest; omitted on pre-snapshot caches. */
  pageCount?: number;
  /**
   * Cached cover file path. `null` means no cover; omitted means snapshot not written yet.
   */
  coverPath?: string | null;
};

const DB_NAME = 'books-cache';
const DB_VERSION = 1;
const META_STORE = 'meta';
const FILES_STORE = 'files';

const KEY_SEP = '\0';

const blobUrlCache = new Map<string, string>();

let dbPromise: Promise<IDBDatabase> | null = null;

export function fileRecordKey(sourceUrl: string, relativePath: string) {
  return `${sourceUrl}${KEY_SEP}${relativePath}`;
}

export function fileKeyRange(sourceUrl: string): IDBKeyRange {
  const prefix = `${sourceUrl}${KEY_SEP}`;
  return IDBKeyRange.bound(prefix, `${prefix}\uffff`);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'sourceUrl' });
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }
    };
  });
}

async function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDb().then((db) => {
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      return db;
    });
  }
  try {
    return await dbPromise;
  } catch (error) {
    dbPromise = null;
    throw error;
  }
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function idbTransactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export async function getBookCacheMeta(sourceUrl: string): Promise<BookCacheMeta | null> {
  const db = await getDb();
  const meta = await idbRequest(
    db.transaction(META_STORE, 'readonly').objectStore(META_STORE).get(sourceUrl),
  );
  if (!meta || (meta as BookCacheMeta).status !== 'ready') return null;
  return meta as BookCacheMeta;
}

export async function isBookCached(sourceUrl: string): Promise<boolean> {
  return Boolean(await getBookCacheMeta(sourceUrl));
}

export async function getCachedFile(sourceUrl: string, relativePath: string): Promise<Blob | null> {
  const db = await getDb();
  const key = fileRecordKey(sourceUrl, relativePath);
  const blob = await idbRequest(
    db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).get(key),
  );
  return blob instanceof Blob ? blob : null;
}

export async function getCachedBlobUrl(
  sourceUrl: string,
  relativePath: string,
): Promise<string | null> {
  const cacheKey = fileRecordKey(sourceUrl, relativePath);
  const existing = blobUrlCache.get(cacheKey);
  if (existing) return existing;

  const blob = await getCachedFile(sourceUrl, relativePath);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  blobUrlCache.set(cacheKey, url);
  return url;
}

/** In-memory blob URL for a cached file, if already created. */
export function peekBlobUrl(sourceUrl: string, relativePath: string): string | undefined {
  return blobUrlCache.get(fileRecordKey(sourceUrl, relativePath));
}

export function peekBlobUrlsForRelativePath(relativePath: string): string[] {
  const suffix = `${KEY_SEP}${relativePath}`;
  const urls: string[] = [];
  for (const [key, url] of blobUrlCache) {
    if (key.endsWith(suffix)) urls.push(url);
  }
  return urls;
}

function revokeBlobUrlsForSource(sourceUrl: string) {
  const prefix = `${sourceUrl}${KEY_SEP}`;
  for (const [key, url] of blobUrlCache) {
    if (key.startsWith(prefix) || key === fileRecordKey(sourceUrl, '')) {
      URL.revokeObjectURL(url);
      blobUrlCache.delete(key);
    }
  }
}

export async function deleteBookCacheRecords(sourceUrl: string): Promise<void> {
  revokeBlobUrlsForSource(sourceUrl);

  const db = await getDb();
  const tx = db.transaction([META_STORE, FILES_STORE], 'readwrite');
  const metaStore = tx.objectStore(META_STORE);
  const filesStore = tx.objectStore(FILES_STORE);

  metaStore.delete(sourceUrl);

  const keys = await idbRequest(filesStore.getAllKeys(fileKeyRange(sourceUrl)));
  for (const key of keys) {
    filesStore.delete(key);
  }

  await idbTransactionDone(tx);
}

export async function clearAllCacheRecords(): Promise<void> {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();

  const db = await getDb();
  const tx = db.transaction([META_STORE, FILES_STORE], 'readwrite');
  tx.objectStore(META_STORE).clear();
  tx.objectStore(FILES_STORE).clear();
  await idbTransactionDone(tx);
}

export async function putFiles(
  sourceUrl: string,
  entries: Array<{ relativePath: string; blob: Blob }>,
) {
  const db = await getDb();
  const tx = db.transaction(FILES_STORE, 'readwrite');
  const store = tx.objectStore(FILES_STORE);
  for (const entry of entries) {
    store.put(entry.blob, fileRecordKey(sourceUrl, entry.relativePath));
  }
  await idbTransactionDone(tx);
}

export async function putMeta(meta: BookCacheMeta) {
  const db = await getDb();
  const tx = db.transaction(META_STORE, 'readwrite');
  tx.objectStore(META_STORE).put(meta);
  await idbTransactionDone(tx);
}

export async function readCachedText(
  sourceUrl: string,
  relativePath: string,
): Promise<string | null> {
  const blob = await getCachedFile(sourceUrl, relativePath);
  if (!blob) return null;
  return blob.text();
}

/** Test helper: drop in-memory blob URLs without touching IndexedDB. */
export function resetBlobUrlCacheForTests() {
  for (const [, url] of blobUrlCache) {
    URL.revokeObjectURL(url);
  }
  blobUrlCache.clear();
}
