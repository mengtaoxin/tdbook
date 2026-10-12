/** Unnamed bookmarks kept per book; named ones are permanent and not counted. */
export const MAX_RECENT_BOOKMARKS = 10;

export type Bookmark = {
  id: string;
  bookId: string;
  /** Set = named (permanent). Missing = recent, subject to `MAX_RECENT_BOOKMARKS`. */
  name?: string;
  /** Epoch milliseconds of the latest save. */
  savedAt: number;
  page: number;
  /** In-page anchor: `#char:N` (EPUB content offset) or `#elementId`. */
  location: string;
};

export type BookBookmarks = {
  named: Bookmark[];
  recent: Bookmark[];
};

export function readerBookIdFromPath(pathname: string): string | null {
  const match = /^\/book\/([^/]+)$/.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function newestFirst(a: Bookmark, b: Bookmark): number {
  return b.savedAt - a.savedAt;
}

export function groupBookBookmarks(list: Bookmark[], bookId: string): BookBookmarks {
  const own = list.filter((bookmark) => bookmark.bookId === bookId).sort(newestFirst);
  return {
    named: own.filter((bookmark) => bookmark.name !== undefined),
    recent: own.filter((bookmark) => bookmark.name === undefined),
  };
}

/**
 * Save a position as a recent bookmark. Saving the same position as the newest
 * recent bookmark only refreshes its time; older recent ones beyond the limit are dropped.
 */
export function addBookmark(
  list: Bookmark[],
  input: { id: string; bookId: string; page: number; location: string; now: number },
): Bookmark[] {
  const newest = groupBookBookmarks(list, input.bookId).recent[0];
  if (newest && newest.page === input.page && newest.location === input.location) {
    return list.map((bookmark) =>
      bookmark.id === newest.id ? { ...bookmark, savedAt: input.now } : bookmark,
    );
  }

  const added: Bookmark = {
    id: input.id,
    bookId: input.bookId,
    page: input.page,
    location: input.location,
    savedAt: input.now,
  };
  const next = [...list, added];
  const dropped = new Set(
    groupBookBookmarks(next, input.bookId)
      .recent.slice(MAX_RECENT_BOOKMARKS)
      .map((bookmark) => bookmark.id),
  );
  return next.filter((bookmark) => !dropped.has(bookmark.id));
}

/** Naming a bookmark makes it permanent. */
export function renameBookmark(list: Bookmark[], id: string, name: string): Bookmark[] {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('errors.invalidBookmarkName');
  return list.map((bookmark) => (bookmark.id === id ? { ...bookmark, name: trimmed } : bookmark));
}

export function removeBookmark(list: Bookmark[], id: string): Bookmark[] {
  return list.filter((bookmark) => bookmark.id !== id);
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
};

/** Time only for today; month and day otherwise; plus year when it differs from `now`. */
export function formatBookmarkTime(savedAt: number, now: number, locale: string): string {
  const saved = new Date(savedAt);
  const current = new Date(now);
  const sameYear = saved.getFullYear() === current.getFullYear();
  const sameDay =
    sameYear && saved.getMonth() === current.getMonth() && saved.getDate() === current.getDate();
  const options: Intl.DateTimeFormatOptions = sameDay
    ? TIME_FORMAT
    : {
        ...(sameYear ? {} : { year: 'numeric' }),
        month: 'short',
        day: 'numeric',
        ...TIME_FORMAT,
      };
  return new Intl.DateTimeFormat(locale, options).format(saved);
}
