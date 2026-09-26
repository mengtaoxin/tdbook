import type { BookType } from './bookTypes';
import { isBookCached, putMeta, type BookCacheMeta } from './cacheStore';
import type { FormatSnapshot } from './formatAdapter';

export type CacheProgress = {
  phase: 'download' | 'extract' | 'done';
  loaded: number;
  total: number | null;
};

export type BookIngestFn = (
  sourceUrl: string,
  blob: Blob,
  onProgress?: (progress: CacheProgress) => void,
) => Promise<void>;

const ensureInFlight = new Map<string, Promise<void>>();

async function fetchAsBlob(
  sourceUrl: string,
  onProgress?: (progress: CacheProgress) => void,
): Promise<Blob> {
  // Remote hosts must allow CORS for browser fetch.
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`errors.downloadFailed:${response.status}`);
  }

  const totalHeader = response.headers.get('Content-Length');
  const total = totalHeader ? Number.parseInt(totalHeader, 10) : null;
  const body = response.body;
  if (!body || total == null || !Number.isFinite(total)) {
    const blob = await response.blob();
    onProgress?.({ phase: 'download', loaded: blob.size, total: blob.size });
    return blob;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.byteLength;
      onProgress?.({ phase: 'download', loaded, total });
    }
  }

  const merged = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Blob([merged], {
    type: response.headers.get('Content-Type') ?? 'application/octet-stream',
  });
}

async function downloadAndStore(
  sourceUrl: string,
  type: BookType,
  catalogId: string,
  ingest: BookIngestFn,
  snapshot: ((sourceUrl: string) => Promise<FormatSnapshot | null>) | undefined,
  onProgress?: (progress: CacheProgress) => void,
) {
  const blob = await fetchAsBlob(sourceUrl, onProgress);
  await ingest(sourceUrl, blob, onProgress);

  let snap: FormatSnapshot | null = null;
  try {
    snap = (await snapshot?.(sourceUrl)) ?? null;
  } catch {
    snap = null;
  }

  const meta: BookCacheMeta = {
    sourceUrl,
    type,
    id: catalogId,
    status: 'ready',
    downloadedAt: Date.now(),
    pageCount: snap?.pageCount,
    coverPath: snap ? snap.coverPath : undefined,
  };
  await putMeta(meta);
  onProgress?.({ phase: 'done', loaded: 1, total: 1 });
}

/** Download once, then let the format adapter persist files and snapshot meta. */
export async function ensureBookCached(
  sourceUrl: string,
  options: {
    type: BookType;
    ingest: BookIngestFn;
    snapshot?: (sourceUrl: string) => Promise<FormatSnapshot | null>;
    catalogId?: string;
    onProgress?: (progress: CacheProgress) => void;
  },
): Promise<void> {
  if (await isBookCached(sourceUrl)) {
    options.onProgress?.({ phase: 'done', loaded: 1, total: 1 });
    return;
  }

  const id = options.catalogId ?? sourceUrl;
  let pending = ensureInFlight.get(sourceUrl);
  if (!pending) {
    pending = downloadAndStore(
      sourceUrl,
      options.type,
      id,
      options.ingest,
      options.snapshot,
      options.onProgress,
    ).finally(() => {
      ensureInFlight.delete(sourceUrl);
    });
    ensureInFlight.set(sourceUrl, pending);
  }
  await pending;
}

export function cancelEnsureInFlight(sourceUrl: string) {
  ensureInFlight.delete(sourceUrl);
}

export function clearEnsureInFlight() {
  ensureInFlight.clear();
}
