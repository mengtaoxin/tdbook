import type { RecentRead } from '@/lib/recentReads';

export const RECENT_READS_STORAGE_KEY = 'books.recentReads';

function isRecentRead(value: unknown): value is RecentRead {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.bookId === 'string' &&
    item.bookId.length > 0 &&
    typeof item.enteredAt === 'number' &&
    Number.isFinite(item.enteredAt) &&
    typeof item.lastAccessedAt === 'number' &&
    Number.isFinite(item.lastAccessedAt)
  );
}

/** Sticky recent-read rows; records that do not match the current shape are dropped. */
export function loadRecentReads(): RecentRead[] {
  try {
    const raw = localStorage.getItem(RECENT_READS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { recentReads?: unknown } | null;
    const recentReads = parsed?.recentReads;
    return Array.isArray(recentReads) ? recentReads.filter(isRecentRead) : [];
  } catch {
    return [];
  }
}

/** @throws `errors.localStorageWrite` when the write fails (e.g. quota). */
export function storeRecentReads(recentReads: RecentRead[]): void {
  try {
    localStorage.setItem(RECENT_READS_STORAGE_KEY, JSON.stringify({ recentReads }));
  } catch {
    throw new Error('errors.localStorageWrite');
  }
}
