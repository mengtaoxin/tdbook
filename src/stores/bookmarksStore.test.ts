import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadBookmarks } from '@/lib/bookmarkStorage';
import { useBookmarksStore } from '@/stores/bookmarksStore';

const position = { bookId: 'sample-epub', page: 2, location: '#char:7' };

describe('bookmarksStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useBookmarksStore.setState({ bookmarks: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists save, rename, and remove', () => {
    const { save, rename, remove } = useBookmarksStore.getState();

    save(position);
    const [saved] = useBookmarksStore.getState().bookmarks;
    expect(saved).toMatchObject(position);
    expect(saved?.name).toBeUndefined();
    expect(loadBookmarks()).toEqual([saved]);

    rename(saved!.id, 'Chapter 3');
    expect(loadBookmarks()[0]?.name).toBe('Chapter 3');
    expect(useBookmarksStore.getState().bookmarks[0]?.name).toBe('Chapter 3');

    remove(saved!.id);
    expect(loadBookmarks()).toEqual([]);
    expect(useBookmarksStore.getState().bookmarks).toEqual([]);
  });

  it('persists an updated reading position without changing the name', () => {
    const { save, rename, update } = useBookmarksStore.getState();

    save(position);
    const [saved] = useBookmarksStore.getState().bookmarks;
    rename(saved!.id, 'Chapter 3');

    update(saved!.id, { page: 4, location: '#char:40' });

    const [updated] = loadBookmarks();
    expect(updated).toMatchObject({
      id: saved!.id,
      bookId: 'sample-epub',
      name: 'Chapter 3',
      page: 4,
      location: '#char:40',
    });
    expect(updated?.savedAt).toBeGreaterThanOrEqual(saved!.savedAt);
    expect(useBookmarksStore.getState().bookmarks[0]).toEqual(updated);
  });

  it('keeps state unchanged when the write fails', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => useBookmarksStore.getState().save(position)).toThrow('errors.localStorageWrite');
    expect(useBookmarksStore.getState().bookmarks).toEqual([]);
  });
});
