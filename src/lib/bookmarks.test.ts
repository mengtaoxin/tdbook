import { describe, expect, it } from 'vitest';
import {
  addBookmark,
  type Bookmark,
  formatBookmarkTime,
  groupBookBookmarks,
  MAX_RECENT_BOOKMARKS,
  readerBookIdFromPath,
  removeBookmark,
  renameBookmark,
} from '@/lib/bookmarks';
import en from '@/i18n/locales/en';
import zh from '@/i18n/locales/zh';

const BOOK = 'sample-epub';

function saveMany(list: Bookmark[], count: number, bookId = BOOK, startAt = 1): Bookmark[] {
  let next = list;
  for (let i = 0; i < count; i += 1) {
    const n = startAt + i;
    next = addBookmark(next, {
      id: `${bookId}-${n}`,
      bookId,
      page: n,
      location: `#char:${n}`,
      now: n * 1000,
    });
  }
  return next;
}

describe('bookmarks', () => {
  it('recognizes a reader route and ignores other paths', () => {
    expect(readerBookIdFromPath('/book/sample-epub')).toBe('sample-epub');
    expect(readerBookIdFromPath('/book/a%20b')).toBe('a b');
    expect(readerBookIdFromPath('/books')).toBeNull();
    expect(readerBookIdFromPath('/book')).toBeNull();
    expect(readerBookIdFromPath('/book/sample-epub/extra')).toBeNull();
  });

  it('adds a save as a recent (unnamed) bookmark', () => {
    const list = addBookmark([], {
      id: 'a',
      bookId: BOOK,
      page: 2,
      location: '#char:120',
      now: 1000,
    });

    expect(list).toEqual([
      { id: 'a', bookId: BOOK, page: 2, location: '#char:120', savedAt: 1000 },
    ]);
    expect(groupBookBookmarks(list, BOOK)).toEqual({ named: [], recent: list });
  });

  it('keeps only the latest recent bookmarks per book', () => {
    const other = saveMany([], 3, 'sample-pdf');
    const list = saveMany(other, MAX_RECENT_BOOKMARKS + 1);

    const { recent } = groupBookBookmarks(list, BOOK);
    expect(recent).toHaveLength(MAX_RECENT_BOOKMARKS);
    expect(recent.map((item) => item.id)).not.toContain(`${BOOK}-1`);
    expect(recent[0]?.id).toBe(`${BOOK}-${MAX_RECENT_BOOKMARKS + 1}`);
    expect(groupBookBookmarks(list, 'sample-pdf').recent).toHaveLength(3);
  });

  it('refreshes the newest recent bookmark instead of duplicating the same position', () => {
    const first = addBookmark([], {
      id: 'a',
      bookId: BOOK,
      page: 2,
      location: '#char:5',
      now: 1000,
    });
    const second = addBookmark(first, {
      id: 'b',
      bookId: BOOK,
      page: 2,
      location: '#char:5',
      now: 2000,
    });

    expect(second).toEqual([
      { id: 'a', bookId: BOOK, page: 2, location: '#char:5', savedAt: 2000 },
    ]);
  });

  it('renaming makes a bookmark permanent and frees its recent slot', () => {
    const saved = saveMany([], 1);
    const named = renameBookmark(saved, `${BOOK}-1`, '  Chapter 3  ');
    const list = saveMany(named, MAX_RECENT_BOOKMARKS, BOOK, 2);

    const { named: permanent, recent } = groupBookBookmarks(list, BOOK);
    expect(permanent).toEqual([
      {
        id: `${BOOK}-1`,
        bookId: BOOK,
        page: 1,
        location: '#char:1',
        savedAt: 1000,
        name: 'Chapter 3',
      },
    ]);
    expect(recent).toHaveLength(MAX_RECENT_BOOKMARKS);
  });

  it('rejects an empty name', () => {
    const saved = saveMany([], 1);
    expect(() => renameBookmark(saved, `${BOOK}-1`, '   ')).toThrow('errors.invalidBookmarkName');
  });

  it('removes a bookmark by id', () => {
    const list = saveMany([], 2);
    expect(removeBookmark(list, `${BOOK}-1`).map((item) => item.id)).toEqual([`${BOOK}-2`]);
  });

  it('groups one book into named and recent, newest first', () => {
    let list = saveMany([], 4);
    list = renameBookmark(list, `${BOOK}-1`, 'old name');
    list = renameBookmark(list, `${BOOK}-3`, 'new name');
    list = saveMany(list, 1, 'sample-pdf');

    const { named, recent } = groupBookBookmarks(list, BOOK);
    expect(named.map((item) => item.id)).toEqual([`${BOOK}-3`, `${BOOK}-1`]);
    expect(recent.map((item) => item.id)).toEqual([`${BOOK}-4`, `${BOOK}-2`]);
  });

  it('formats today as time only and other days with the date', () => {
    const now = new Date(2026, 9, 12, 18, 0).getTime();
    const today = new Date(2026, 9, 12, 15, 3).getTime();
    const yesterday = new Date(2026, 9, 11, 21, 30).getTime();
    const lastYear = new Date(2025, 0, 2, 8, 5).getTime();

    expect(formatBookmarkTime(today, now, 'en')).toBe('15:03');
    expect(formatBookmarkTime(today, now, 'zh')).toBe('15:03');
    expect(formatBookmarkTime(yesterday, now, 'en')).toBe('Oct 11, 21:30');
    expect(formatBookmarkTime(yesterday, now, 'zh')).toBe('10月11日 21:30');
    expect(formatBookmarkTime(lastYear, now, 'en')).toContain('2025');
  });

  it('has bookmark copy in both locales', () => {
    expect(en.nav.bookmarks).toBe('Bookmarks');
    expect(zh.nav.bookmarks).toBe('书签');
    expect(en.bookmarks.save).toBe('Save bookmark');
    expect(zh.bookmarks.save).toBe('保存书签');
    expect(Object.keys(zh.bookmarks).sort()).toEqual(Object.keys(en.bookmarks).sort());
  });
});
