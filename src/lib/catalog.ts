import { isCatalogResourcePath, isSafeSegment } from './paths';
import { getConfigsUrl } from './settings';
import type { BookType } from './bookTypes';

export type BookConfig = {
  id: string;
  title: string;
  /** Optional; omit or "" when unknown. */
  author?: string;
  type?: string;
  /** Remote `http(s)://…` or site-absolute `/…` (e.g. under `public/`). */
  path: string;
  /** Optional cover image: `http(s)://…` or site path `/…` (e.g. under `public/`). */
  hover?: string;
};

type BookConfigsFile = {
  books: BookConfig[];
};

export type BookConfigsResult = {
  books: BookConfig[];
  duplicateIds: string[];
};

export type PersistedBookConfigs = {
  url: string;
  books: BookConfig[];
};

const CONFIGS_CACHE_KEY = 'books.configsCache';
const FETCH_TIMEOUT_MS = 10_000;
/** Book-list revisits within this window reuse the last download instead of refetching. */
const REVALIDATE_INTERVAL_MS = 30_000;

type CatalogEntry = {
  url: string;
  result: BookConfigsResult;
  /** `Date.now()` of the network download, or null when restored from localStorage. */
  fetchedAt: number | null;
};

let catalogCache: CatalogEntry | null = null;
let inflight: { url: string; promise: Promise<BookConfigsResult | null> } | null = null;
let cacheGeneration = 0;

export function invalidateBookConfigsCache() {
  catalogCache = null;
  inflight = null;
  cacheGeneration += 1;
}

/** Last successfully downloaded catalog (any URL), or null if none / unreadable. */
export function getPersistedBookConfigs(): PersistedBookConfigs | null {
  try {
    const raw = localStorage.getItem(CONFIGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedBookConfigs>;
    if (typeof parsed.url !== 'string' || !Array.isArray(parsed.books)) {
      return null;
    }
    return { url: parsed.url, books: parsed.books };
  } catch {
    return null;
  }
}

export function clearPersistedBookConfigs(): void {
  try {
    localStorage.removeItem(CONFIGS_CACHE_KEY);
  } catch {
    // ignore quota / private-mode failures on clear
  }
}

function persistBookConfigs(url: string, books: BookConfig[]): void {
  try {
    const payload: PersistedBookConfigs = { url, books };
    localStorage.setItem(CONFIGS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Durable cache is best-effort; in-memory cache still applies.
  }
}

/** Accept `http(s)://…` or same-origin `/…` cover paths; ignore anything else. */
export function optionalCoverUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return isCatalogResourcePath(trimmed) ? trimmed : undefined;
}

export function bookTypeOf(config: BookConfig): BookType {
  return config.type === 'pdf' ? 'pdf' : 'epub';
}

export function normalizeBookConfigs(books: BookConfig[]): BookConfigsResult {
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  const deduped: BookConfig[] = [];

  for (const book of books) {
    const type = book.type ?? 'epub';
    if (
      typeof book.id !== 'string' ||
      !isSafeSegment(book.id) ||
      (type !== 'epub' && type !== 'pdf') ||
      typeof book.path !== 'string' ||
      !isCatalogResourcePath(book.path)
    ) {
      continue;
    }

    if (seen.has(book.id)) {
      if (!duplicateIds.includes(book.id)) {
        duplicateIds.push(book.id);
      }
      continue;
    }

    seen.add(book.id);
    deduped.push({
      ...book,
      path: book.path.trim(),
      hover: optionalCoverUrl(book.hover),
    });
  }

  return { books: deduped, duplicateIds };
}

function persistedResultFor(url: string): BookConfigsResult | null {
  const persisted = getPersistedBookConfigs();
  if (!persisted || persisted.url !== url) return null;
  return normalizeBookConfigs(persisted.books);
}

function isNavigatorOffline(): boolean {
  try {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  } catch {
    return false;
  }
}

function emptyResult(): BookConfigsResult {
  return { books: [], duplicateIds: [] };
}

async function downloadBookConfigs(url: string): Promise<BookConfig[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // `no-cache` revalidates with the server (ETag / Last-Modified) so remote
    // edits are not hidden behind the HTTP cache.
    const response = await fetch(url, { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) return null;
    const parsed = (await response.json()) as Partial<BookConfigsFile> | null;
    return Array.isArray(parsed?.books) ? parsed.books : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Download, persist and memoize the catalog; null when the network or response is unusable. */
function fetchBookConfigs(url: string): Promise<BookConfigsResult | null> {
  if (inflight?.url === url) return inflight.promise;

  const generation = cacheGeneration;
  const promise = (async () => {
    const books = await downloadBookConfigs(url);
    if (!books || generation !== cacheGeneration) return null;
    persistBookConfigs(url, books);
    const result = normalizeBookConfigs(books);
    catalogCache = { url, result, fetchedAt: Date.now() };
    return result;
  })();

  const entry = { url, promise };
  inflight = entry;
  void promise.finally(() => {
    if (inflight === entry) inflight = null;
  });
  return promise;
}

/**
 * Current catalog without waiting on the network when a copy is available:
 * memory, then the last successful download in localStorage, then a fresh download.
 * Pair with `revalidateBookConfigs()` to pick up remote edits.
 */
export async function getBookConfigs(): Promise<BookConfigsResult> {
  const url = getConfigsUrl();
  if (catalogCache?.url === url) return catalogCache.result;

  const persisted = persistedResultFor(url);
  if (persisted) {
    catalogCache = { url, result: persisted, fetchedAt: null };
    return persisted;
  }

  if (isNavigatorOffline()) return emptyResult();
  return (await fetchBookConfigs(url)) ?? emptyResult();
}

/**
 * Re-download configs.json and replace the cached catalog on success.
 * Resolves true only when the catalog changed; failures keep the current copy.
 */
export async function revalidateBookConfigs(): Promise<boolean> {
  const url = getConfigsUrl();
  if (isNavigatorOffline()) return false;

  const current = catalogCache?.url === url ? catalogCache : null;
  if (current?.fetchedAt != null && Date.now() - current.fetchedAt < REVALIDATE_INTERVAL_MS) {
    return false;
  }

  const before = current?.result ?? persistedResultFor(url);
  const next = await fetchBookConfigs(url);
  if (!next) return false;
  return JSON.stringify(next) !== JSON.stringify(before);
}
