import { beforeEach, describe, expect, it } from 'vitest';
import type { Bookmark } from '@/lib/bookmarks';
import { BOOKMARKS_STORAGE_KEY, loadBookmarks, storeBookmarks } from '@/lib/bookmarkStorage';

const named: Bookmark = {
  id: 'a',
  bookId: 'sample-epub',
  name: 'Chapter 3',
  savedAt: 1000,
  page: 3,
  location: '#char:42',
};
const recent: Bookmark = {
  id: 'b',
  bookId: 'sample-epub',
  savedAt: 2000,
  page: 1,
  location: '',
};

describe('bookmarkStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    expect(loadBookmarks()).toEqual([]);
  });

  it('round-trips stored bookmarks', () => {
    storeBookmarks([named, recent]);
    expect(JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY) ?? '')).toEqual({
      bookmarks: [named, recent],
    });
    expect(loadBookmarks()).toEqual([named, recent]);
  });

  it('reads damaged JSON as empty', () => {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, '{');
    expect(loadBookmarks()).toEqual([]);
  });

  it('drops records that do not match the current shape', () => {
    localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify({
        bookmarks: [
          { 'book-id': 'sample-epub', isDefault: true, location: '', name: 'Default', page: 2 },
          { ...recent, page: 0 },
          { ...named, name: '' },
          recent,
        ],
      }),
    );
    expect(loadBookmarks()).toEqual([recent]);
  });
});
