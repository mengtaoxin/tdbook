import { SQLITE_OPEN_CREATE, SQLITE_OPEN_READWRITE } from 'wa-sqlite';
import { MemoryVFS } from 'wa-sqlite/src/examples/MemoryVFS.js';
import { createAsyncLock } from './asyncLock';
import type { CacheDb } from './cacheDb';
import { createSqliteApi } from './cacheSqliteModule';
import {
  applySchema,
  CACHE_DB_FILENAME,
  sqlClearAll,
  sqlDeleteBook,
  sqlGetFile,
  sqlGetMeta,
  sqlPutFiles,
  sqlPutMeta,
  type SqliteHandle,
} from './cacheSqliteSql';

function handleDb(handle: SqliteHandle): CacheDb {
  const run = createAsyncLock();
  return {
    getMeta: (sourceUrl) => run(() => sqlGetMeta(handle, sourceUrl)),
    putMeta: (meta) => run(() => sqlPutMeta(handle, meta)),
    getFile: (sourceUrl, relativePath) => run(() => sqlGetFile(handle, sourceUrl, relativePath)),
    putFiles: (sourceUrl, entries) => run(() => sqlPutFiles(handle, sourceUrl, entries)),
    deleteBook: (sourceUrl) => run(() => sqlDeleteBook(handle, sourceUrl)),
    clearAll: () => run(() => sqlClearAll(handle)),
  };
}

/** In-memory SQLite backend for Vitest / environments without OPFS. */
export async function openMemoryCacheDb(): Promise<CacheDb> {
  const sqlite3 = await createSqliteApi();
  const vfs = new MemoryVFS();
  // Unique VFS name so repeated opens in one process do not clash.
  const vfsName = `memory-${Math.random().toString(36).slice(2)}`;
  Object.defineProperty(vfs, 'name', { value: vfsName });
  // Example VFS typings lag the runtime SQLiteVFS shape used by wa-sqlite.
  sqlite3.vfs_register(vfs as never, false);
  const db = await sqlite3.open_v2(
    CACHE_DB_FILENAME,
    SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE,
    vfsName,
  );
  const handle: SqliteHandle = { sqlite3, db };
  await applySchema(handle);
  return handleDb(handle);
}
