import { downloadAndStore, type CacheableFormat, type CacheProgress } from './cacheIngest';
import { clearAllCacheRecords, deleteBookCacheRecords, isBookCached } from './cacheStore';
import { notifyFormatCacheCleared } from './formats';

export const CACHE_CLEARED_ERROR = 'errors.cacheCleared';

type ProgressListener = (progress: CacheProgress) => void;

type CacheJob = {
  controller: AbortController;
  listeners: Set<ProgressListener>;
  /** Replayed to callers that join after the download started. */
  lastProgress: CacheProgress | null;
  done: Promise<void>;
  /** `done` with rejections swallowed, for callers that only wait for the job to stop. */
  settled: Promise<void>;
};

const jobs = new Map<string, CacheJob>();

function noop() {}

function startJob(sourceUrl: string, format: CacheableFormat, catalogId: string): CacheJob {
  const controller = new AbortController();
  const job: CacheJob = {
    controller,
    listeners: new Set(),
    lastProgress: null,
    done: Promise.resolve(),
    settled: Promise.resolve(),
  };

  job.done = downloadAndStore(sourceUrl, {
    format,
    catalogId,
    signal: controller.signal,
    onProgress: (progress) => {
      job.lastProgress = progress;
      for (const listener of job.listeners) listener(progress);
    },
  })
    .catch((error: unknown) => {
      throw controller.signal.aborted ? controller.signal.reason : error;
    })
    .finally(() => {
      if (jobs.get(sourceUrl) === job) jobs.delete(sourceUrl);
    });
  job.settled = job.done.then(noop, noop);
  return job;
}

/**
 * Download once per source, then let the format persist files and snapshot meta.
 * Concurrent callers share one download and all receive its progress. Rejects with
 * `errors.cacheCleared` when the cache is cleared mid-download.
 */
export async function ensureBookCached(
  sourceUrl: string,
  options: {
    format: CacheableFormat;
    catalogId?: string;
    onProgress?: ProgressListener;
  },
): Promise<void> {
  const { format, onProgress } = options;
  if (await isBookCached(sourceUrl)) {
    onProgress?.({ phase: 'done', loaded: 1, total: 1 });
    return;
  }

  let job = jobs.get(sourceUrl);
  if (!job) {
    job = startJob(sourceUrl, format, options.catalogId ?? sourceUrl);
    jobs.set(sourceUrl, job);
  }

  if (onProgress) {
    if (job.lastProgress) onProgress(job.lastProgress);
    job.listeners.add(onProgress);
  }
  try {
    await job.done;
  } finally {
    if (onProgress) job.listeners.delete(onProgress);
  }
}

async function abortJob(job: CacheJob): Promise<void> {
  job.controller.abort(new Error(CACHE_CLEARED_ERROR));
  await job.settled;
}

export async function clearBookCache(sourceUrl: string): Promise<void> {
  notifyFormatCacheCleared(sourceUrl);
  const job = jobs.get(sourceUrl);
  if (job) await abortJob(job);
  await deleteBookCacheRecords(sourceUrl);
}

/** Clears IndexedDB cache and in-memory blob URLs for every book. */
export async function clearAllBookCaches(): Promise<void> {
  notifyFormatCacheCleared(null);
  await Promise.all([...jobs.values()].map(abortJob));
  await clearAllCacheRecords();
}
