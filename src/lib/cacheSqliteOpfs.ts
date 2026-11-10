import type { CacheDb } from './cacheDb';
import type { CacheMetaRow } from './cacheSqliteSql';
import type { WorkerPayload, WorkerRequest, WorkerResponse } from './cacheSqlite.worker';

type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

function createWorkerRpc(worker: Worker) {
  let nextId = 1;
  const pending = new Map<number, Pending>();

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const entry = pending.get(response.reqId);
    if (!entry) return;
    pending.delete(response.reqId);
    if (response.ok) entry.resolve(response.result);
    else entry.reject(new Error(response.error));
  };

  worker.onerror = (event) => {
    const error = new Error(event.message || 'cache OPFS worker failed');
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
  };

  function call<T>(payload: WorkerPayload, transfer: Transferable[] = []): Promise<T> {
    const reqId = nextId++;
    const message = { ...payload, reqId } as WorkerRequest;
    return new Promise<T>((resolve, reject) => {
      pending.set(reqId, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      worker.postMessage(message, transfer);
    });
  }

  return call;
}

function cacheDbFromRpc(
  call: <T>(payload: WorkerPayload, transfer?: Transferable[]) => Promise<T>,
): CacheDb {
  return {
    getMeta: (sourceUrl) => call<CacheMetaRow | null>({ op: 'getMeta', sourceUrl }),
    putMeta: async (meta) => {
      await call<null>({ op: 'putMeta', meta });
    },
    async getFile(sourceUrl, relativePath) {
      const result = await call<{ mimeType: string; bytes: ArrayBuffer } | null>({
        op: 'getFile',
        sourceUrl,
        relativePath,
      });
      if (!result) return null;
      return new Blob([result.bytes], result.mimeType ? { type: result.mimeType } : undefined);
    },
    async putFiles(sourceUrl, entries) {
      const serialized = await Promise.all(
        entries.map(async (entry) => ({
          relativePath: entry.relativePath,
          mimeType: entry.blob.type,
          bytes: await entry.blob.arrayBuffer(),
        })),
      );
      await call<null>(
        { op: 'putFiles', sourceUrl, entries: serialized },
        serialized.map((entry) => entry.bytes),
      );
    },
    async deleteBook(sourceUrl) {
      await call<null>({ op: 'deleteBook', sourceUrl });
    },
    async clearAll() {
      await call<null>({ op: 'clearAll' });
    },
  };
}

/** OPFS-backed cache DB via a dedicated Worker (AccessHandlePoolVFS). */
export async function openOpfsCacheDb(): Promise<CacheDb> {
  const worker = new Worker(new URL('./cacheSqlite.worker.ts', import.meta.url), {
    type: 'module',
  });
  const call = createWorkerRpc(worker);
  await call<null>({ op: 'init' });
  return cacheDbFromRpc(call);
}
