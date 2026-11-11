import type { BookConfig, PersistedBookConfigs } from './types';

const CONFIGS_CACHE_KEY = 'books.configsCache';

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

export function persistBookConfigs(url: string, books: BookConfig[]): void {
  try {
    const payload: PersistedBookConfigs = { url, books };
    localStorage.setItem(CONFIGS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Durable cache is best-effort; in-memory cache still applies.
  }
}
