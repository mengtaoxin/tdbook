import type { Bookmark } from '@/lib/bookmarks';

export const BOOKMARKS_STORAGE_KEY = 'books.bookmarks';

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.bookId === 'string' &&
    item.bookId.length > 0 &&
    (item.name === undefined || (typeof item.name === 'string' && item.name.length > 0)) &&
    typeof item.savedAt === 'number' &&
    Number.isFinite(item.savedAt) &&
    Number.isInteger(item.page) &&
    (item.page as number) >= 1 &&
    typeof item.location === 'string'
  );
}

/** All books' bookmarks; records that do not match the current shape are dropped. */
export function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { bookmarks?: unknown } | null;
    const bookmarks = parsed?.bookmarks;
    return Array.isArray(bookmarks) ? bookmarks.filter(isBookmark) : [];
  } catch {
    return [];
  }
}

/** @throws `errors.localStorageWrite` when the write fails (e.g. quota). */
export function storeBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify({ bookmarks }));
  } catch {
    throw new Error('errors.localStorageWrite');
  }
}
