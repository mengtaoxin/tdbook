import type { CacheDb } from './cacheDb';
import type { CacheMetaRow } from './cacheSqliteSql';

const LEGACY_DB_NAME = 'tdbook-cache';

type LegacyFileRecord = {
  sourceUrl: string;
  relativePath: string;
  blob: Blob;
};

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('deleteDatabase failed'));
    request.onblocked = () => resolve();
  });
}

async function legacyDbPresent(): Promise<boolean> {
  if (typeof indexedDB.databases === 'function') {
    const dbs = await indexedDB.databases();
    return dbs.some((db) => db.name === LEGACY_DB_NAME);
  }
  // Fallback when `databases()` is missing: open and inspect store names.
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LEGACY_DB_NAME);
    request.onerror = () => reject(request.error ?? new Error('open legacy cache failed'));
    request.onsuccess = () => {
      const db = request.result;
      const hasStores =
        db.objectStoreNames.contains('meta') && db.objectStoreNames.contains('files');
      db.close();
      if (!hasStores) {
        void deleteDatabase(LEGACY_DB_NAME).then(() => resolve(false), reject);
        return;
      }
      resolve(true);
    };
  });
}

function openLegacyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LEGACY_DB_NAME);
    request.onerror = () => reject(request.error ?? new Error('open legacy cache failed'));
    request.onsuccess = () => resolve(request.result);
  });
}

function isCacheMetaRow(value: unknown): value is CacheMetaRow {
  if (!value || typeof value !== 'object') return false;
  const meta = value as Record<string, unknown>;
  return (
    typeof meta.sourceUrl === 'string' &&
    (meta.type === 'epub' || meta.type === 'pdf') &&
    typeof meta.id === 'string' &&
    meta.status === 'ready' &&
    typeof meta.downloadedAt === 'number'
  );
}

/**
 * One-shot copy of the Dexie `tdbook-cache` IndexedDB into SQLite, then drop it.
 * Safe to call repeatedly; no-ops when the legacy DB is absent.
 */
export async function migrateLegacyIndexedDbCache(cacheDb: CacheDb): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  if (!(await legacyDbPresent())) return;

  const legacy = await openLegacyDb();
  try {
    const metaTx = legacy.transaction('meta', 'readonly');
    const metaRows = await idbRequest(metaTx.objectStore('meta').getAll());
    /* oxlint-disable no-await-in-loop -- single SQLite connection; migrate serially */
    for (const row of metaRows) {
      if (isCacheMetaRow(row)) {
        await cacheDb.putMeta(row);
      }
    }

    const filesTx = legacy.transaction('files', 'readonly');
    const fileRows = (await idbRequest(
      filesTx.objectStore('files').getAll(),
    )) as LegacyFileRecord[];

    const bySource = new Map<string, Array<{ relativePath: string; blob: Blob }>>();
    for (const row of fileRows) {
      if (
        !row ||
        typeof row.sourceUrl !== 'string' ||
        typeof row.relativePath !== 'string' ||
        !(row.blob instanceof Blob)
      ) {
        continue;
      }
      const list = bySource.get(row.sourceUrl) ?? [];
      list.push({ relativePath: row.relativePath, blob: row.blob });
      bySource.set(row.sourceUrl, list);
    }
    for (const [sourceUrl, entries] of bySource) {
      await cacheDb.putFiles(sourceUrl, entries);
    }
    /* oxlint-enable no-await-in-loop */
  } finally {
    legacy.close();
  }

  await deleteDatabase(LEGACY_DB_NAME);
}
