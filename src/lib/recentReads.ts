/** Sticky “recently read” list on the books page. */
export const MAX_RECENT_READS = 10;

export type RecentRead = {
  bookId: string;
  /** When the book last entered / was promoted in display order. */
  enteredAt: number;
  /** Last successful open; used only for eviction when the list is full. */
  lastAccessedAt: number;
};

/** Newest `enteredAt` first — the sticky display order. */
export function sortRecentReads(list: RecentRead[]): RecentRead[] {
  return [...list].sort((a, b) => b.enteredAt - a.enteredAt || a.bookId.localeCompare(b.bookId));
}

export function recentReadIds(list: RecentRead[]): string[] {
  return sortRecentReads(list).map((item) => item.bookId);
}

/**
 * Record that `bookId` was opened.
 * Already-listed books only refresh `lastAccessedAt` (order stays put).
 * New books enter at the front; overflow drops the least recently accessed.
 */
export function touchRecentRead(list: RecentRead[], bookId: string, now: number): RecentRead[] {
  const existing = list.find((item) => item.bookId === bookId);
  if (existing) {
    return list.map((item) => (item.bookId === bookId ? { ...item, lastAccessedAt: now } : item));
  }

  const next: RecentRead[] = [...list, { bookId, enteredAt: now, lastAccessedAt: now }];
  if (next.length <= MAX_RECENT_READS) return next;

  const victim = [...next].sort(
    (a, b) => a.lastAccessedAt - b.lastAccessedAt || a.enteredAt - b.enteredAt,
  )[0];
  return next.filter((item) => item.bookId !== victim?.bookId);
}
