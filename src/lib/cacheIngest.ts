import { putMeta, type BookCacheMeta } from './cacheStore';
import type { FormatAdapter, FormatSnapshot } from './formatAdapter';

export type CacheProgress = {
  phase: 'download' | 'extract' | 'done';
  loaded: number;
  total: number | null;
};

/** The part of a format adapter the download pipeline needs. */
export type CacheableFormat = Pick<FormatAdapter, 'type' | 'ingest' | 'snapshot'>;

async function fetchAsBlob(
  sourceUrl: string,
  signal: AbortSignal,
  onProgress: (progress: CacheProgress) => void,
): Promise<Blob> {
  // Remote hosts must allow CORS for browser fetch.
  const response = await fetch(sourceUrl, { signal });
  if (!response.ok) {
    throw new Error(`errors.downloadFailed:${response.status}`);
  }

  const totalHeader = response.headers.get('Content-Length');
  const total = totalHeader ? Number.parseInt(totalHeader, 10) : null;
  const body = response.body;
  if (!body || total == null || !Number.isFinite(total)) {
    const blob = await response.blob();
    onProgress({ phase: 'download', loaded: blob.size, total: blob.size });
    return blob;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    // oxlint-disable-next-line no-await-in-loop -- stream chunks must be read in order
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.byteLength;
      onProgress({ phase: 'download', loaded, total });
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

/**
 * Download → format ingest → snapshot → ready meta. Stops at the next step boundary once
 * `signal` aborts; files an ingest already wrote are left for the caller to delete.
 */
export async function downloadAndStore(
  sourceUrl: string,
  options: {
    format: CacheableFormat;
    catalogId: string;
    signal: AbortSignal;
    onProgress: (progress: CacheProgress) => void;
  },
): Promise<void> {
  const { format, catalogId, signal, onProgress } = options;
  const blob = await fetchAsBlob(sourceUrl, signal, onProgress);
  signal.throwIfAborted();
  await format.ingest(sourceUrl, blob, onProgress);
  signal.throwIfAborted();

  let snap: FormatSnapshot | null = null;
  try {
    snap = await format.snapshot(sourceUrl);
  } catch {
    snap = null;
  }
  signal.throwIfAborted();

  const meta: BookCacheMeta = {
    sourceUrl,
    type: format.type,
    id: catalogId,
    status: 'ready',
    downloadedAt: Date.now(),
    pageCount: snap?.pageCount,
    coverPath: snap ? snap.coverPath : undefined,
  };
  await putMeta(meta);
  onProgress({ phase: 'done', loaded: 1, total: 1 });
}
