/// <reference lib="webworker" />
import { SQLITE_OPEN_CREATE, SQLITE_OPEN_READWRITE } from 'wa-sqlite';
import { AccessHandlePoolVFS } from 'wa-sqlite/src/examples/AccessHandlePoolVFS.js';
import { createAsyncLock } from './asyncLock';
import { createSqliteApi } from './cacheSqliteModule';
import {
  applySchema,
  CACHE_DB_FILENAME,
  OPFS_DIR,
  sqlClearAll,
  sqlDeleteBook,
  sqlGetFile,
  sqlGetMeta,
  sqlPutFiles,
  sqlPutMeta,
  type CacheMetaRow,
  type SqliteHandle,
} from './cacheSqliteSql';

const runExclusive = createAsyncLock();

export type WorkerPayload =
  | { op: 'init' }
  | { op: 'getMeta'; sourceUrl: string }
  | { op: 'putMeta'; meta: CacheMetaRow }
  | { op: 'getFile'; sourceUrl: string; relativePath: string }
  | {
      op: 'putFiles';
      sourceUrl: string;
      entries: Array<{ relativePath: string; mimeType: string; bytes: ArrayBuffer }>;
    }
  | { op: 'deleteBook'; sourceUrl: string }
  | { op: 'clearAll' };

export type WorkerRequest = WorkerPayload & { reqId: number };

export type WorkerResponse =
  | { reqId: number; ok: true; result?: unknown }
  | { reqId: number; ok: false; error: string };

let handlePromise: Promise<SqliteHandle> | null = null;

async function getHandle(): Promise<SqliteHandle> {
  if (!handlePromise) {
    handlePromise = (async () => {
      const sqlite3 = await createSqliteApi();
      const vfs = new AccessHandlePoolVFS(OPFS_DIR);
      await vfs.isReady;
      // Example VFS typings lag the runtime SQLiteVFS shape used by wa-sqlite.
      sqlite3.vfs_register(vfs as never, true);
      const db = await sqlite3.open_v2(
        CACHE_DB_FILENAME,
        SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE,
      );
      // Single-connection OPFS pool: exclusive + WAL cuts write overhead.
      await sqlite3.exec(db, 'PRAGMA locking_mode=exclusive; PRAGMA journal_mode=wal;');
      const handle: SqliteHandle = { sqlite3, db };
      await applySchema(handle);
      return handle;
    })();
  }
  return handlePromise;
}

async function dispatch(message: WorkerRequest): Promise<unknown> {
  if (message.op === 'init') {
    await getHandle();
    return null;
  }

  const handle = await getHandle();
  switch (message.op) {
    case 'getMeta':
      return sqlGetMeta(handle, message.sourceUrl);
    case 'putMeta':
      await sqlPutMeta(handle, message.meta);
      return null;
    case 'getFile': {
      const blob = await sqlGetFile(handle, message.sourceUrl, message.relativePath);
      if (!blob) return null;
      const bytes = await blob.arrayBuffer();
      return { mimeType: blob.type, bytes };
    }
    case 'putFiles':
      await sqlPutFiles(
        handle,
        message.sourceUrl,
        message.entries.map((entry) => ({
          relativePath: entry.relativePath,
          blob: new Blob([entry.bytes], entry.mimeType ? { type: entry.mimeType } : undefined),
        })),
      );
      return null;
    case 'deleteBook':
      await sqlDeleteBook(handle, message.sourceUrl);
      return null;
    case 'clearAll':
      await sqlClearAll(handle);
      return null;
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  void runExclusive(() => dispatch(message))
    .then((result) => {
      const response: WorkerResponse = { reqId: message.reqId, ok: true, result };
      const transfer: Transferable[] = [];
      if (
        result &&
        typeof result === 'object' &&
        'bytes' in result &&
        result.bytes instanceof ArrayBuffer
      ) {
        transfer.push(result.bytes);
      }
      self.postMessage(response, transfer);
    })
    .catch((error: unknown) => {
      const response: WorkerResponse = {
        reqId: message.reqId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      self.postMessage(response);
    });
};
