import { Factory, SQLITE_ROW } from 'wa-sqlite';
import type { BookType } from './bookTypes';

/** Same shape as `BookCacheMeta` in cacheStore — kept local to avoid import cycles. */
export type CacheMetaRow = {
  sourceUrl: string;
  type: BookType;
  id: string;
  status: 'ready';
  downloadedAt: number;
  pageCount?: number;
  coverPath?: string | null;
};

export const CACHE_DB_FILENAME = 'tdbook-cache.db';
export const OPFS_DIR = 'tdbook-cache';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  source_url TEXT PRIMARY KEY NOT NULL,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS files (
  source_url TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT '',
  content BLOB NOT NULL,
  PRIMARY KEY (source_url, relative_path)
);
CREATE INDEX IF NOT EXISTS idx_files_source ON files(source_url);
`;

export type SqliteHandle = {
  sqlite3: ReturnType<typeof Factory>;
  db: number;
};

function isReadyMeta(value: unknown): value is CacheMetaRow {
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

export async function applySchema(handle: SqliteHandle): Promise<void> {
  await handle.sqlite3.exec(handle.db, SCHEMA_SQL);
}

export async function sqlGetMeta(
  handle: SqliteHandle,
  sourceUrl: string,
): Promise<CacheMetaRow | null> {
  let json: string | null = null;
  for await (const stmt of handle.sqlite3.statements(
    handle.db,
    'SELECT json FROM meta WHERE source_url = ?',
  )) {
    handle.sqlite3.bind_text(stmt, 1, sourceUrl);
    if ((await handle.sqlite3.step(stmt)) === SQLITE_ROW) {
      const value = handle.sqlite3.column(stmt, 0);
      json = typeof value === 'string' ? value : null;
    }
  }
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return isReadyMeta(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function sqlPutMeta(handle: SqliteHandle, meta: CacheMetaRow): Promise<void> {
  for await (const stmt of handle.sqlite3.statements(
    handle.db,
    'INSERT OR REPLACE INTO meta (source_url, json) VALUES (?, ?)',
  )) {
    handle.sqlite3.bind_text(stmt, 1, meta.sourceUrl);
    handle.sqlite3.bind_text(stmt, 2, JSON.stringify(meta));
    await handle.sqlite3.step(stmt);
  }
}

export async function sqlGetFile(
  handle: SqliteHandle,
  sourceUrl: string,
  relativePath: string,
): Promise<Blob | null> {
  let mimeType = '';
  let content: Uint8Array | null = null;
  for await (const stmt of handle.sqlite3.statements(
    handle.db,
    'SELECT mime_type, content FROM files WHERE source_url = ? AND relative_path = ?',
  )) {
    handle.sqlite3.bind_text(stmt, 1, sourceUrl);
    handle.sqlite3.bind_text(stmt, 2, relativePath);
    if ((await handle.sqlite3.step(stmt)) === SQLITE_ROW) {
      const mime = handle.sqlite3.column(stmt, 0);
      const blob = handle.sqlite3.column(stmt, 1);
      mimeType = typeof mime === 'string' ? mime : '';
      // Copy before `statements()` finalizes and reclaims WASM heap memory.
      content = blob instanceof Uint8Array ? blob.slice() : null;
    }
  }
  if (!content) return null;
  const bytes = new Uint8Array(content.byteLength);
  bytes.set(content);
  return new Blob([bytes], mimeType ? { type: mimeType } : undefined);
}

export async function sqlPutFiles(
  handle: SqliteHandle,
  sourceUrl: string,
  entries: Array<{ relativePath: string; blob: Blob }>,
): Promise<void> {
  if (entries.length === 0) return;
  await handle.sqlite3.exec(handle.db, 'BEGIN');
  try {
    /* oxlint-disable no-await-in-loop -- single SQLite connection; bind/step must stay serial */
    for (const entry of entries) {
      const bytes = new Uint8Array(await entry.blob.arrayBuffer());
      for await (const stmt of handle.sqlite3.statements(
        handle.db,
        `INSERT OR REPLACE INTO files (source_url, relative_path, mime_type, content)
         VALUES (?, ?, ?, ?)`,
      )) {
        handle.sqlite3.bind_text(stmt, 1, sourceUrl);
        handle.sqlite3.bind_text(stmt, 2, entry.relativePath);
        handle.sqlite3.bind_text(stmt, 3, entry.blob.type);
        handle.sqlite3.bind_blob(stmt, 4, bytes);
        await handle.sqlite3.step(stmt);
      }
    }
    /* oxlint-enable no-await-in-loop */
    await handle.sqlite3.exec(handle.db, 'COMMIT');
  } catch (error) {
    await handle.sqlite3.exec(handle.db, 'ROLLBACK');
    throw error;
  }
}

export async function sqlDeleteBook(handle: SqliteHandle, sourceUrl: string): Promise<void> {
  await handle.sqlite3.exec(handle.db, 'BEGIN');
  try {
    for await (const stmt of handle.sqlite3.statements(
      handle.db,
      'DELETE FROM meta WHERE source_url = ?',
    )) {
      handle.sqlite3.bind_text(stmt, 1, sourceUrl);
      await handle.sqlite3.step(stmt);
    }
    for await (const stmt of handle.sqlite3.statements(
      handle.db,
      'DELETE FROM files WHERE source_url = ?',
    )) {
      handle.sqlite3.bind_text(stmt, 1, sourceUrl);
      await handle.sqlite3.step(stmt);
    }
    await handle.sqlite3.exec(handle.db, 'COMMIT');
  } catch (error) {
    await handle.sqlite3.exec(handle.db, 'ROLLBACK');
    throw error;
  }
}

export async function sqlClearAll(handle: SqliteHandle): Promise<void> {
  await handle.sqlite3.exec(handle.db, 'DELETE FROM meta; DELETE FROM files;');
}
