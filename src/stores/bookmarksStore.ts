import { create } from 'zustand';
import { addBookmark, type Bookmark, removeBookmark, renameBookmark } from '@/lib/bookmarks';
import { loadBookmarks, storeBookmarks } from '@/lib/bookmarkStorage';

type BookmarksState = {
  bookmarks: Bookmark[];
  /** @throws when the position cannot be persisted; state is left unchanged. */
  save: (position: { bookId: string; page: number; location: string }) => void;
  /** @throws on an empty name or a failed write; state is left unchanged. */
  rename: (id: string, name: string) => void;
  /** @throws when the write fails; state is left unchanged. */
  remove: (id: string) => void;
};

/** `randomUUID` only exists in secure contexts (https / localhost). */
function newBookmarkId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

export const useBookmarksStore = create<BookmarksState>((set, get) => {
  function commit(next: Bookmark[]) {
    storeBookmarks(next);
    set({ bookmarks: next });
  }

  return {
    bookmarks: loadBookmarks(),
    save: (position) => {
      commit(addBookmark(get().bookmarks, { ...position, id: newBookmarkId(), now: Date.now() }));
    },
    rename: (id, name) => {
      commit(renameBookmark(get().bookmarks, id, name));
    },
    remove: (id) => {
      commit(removeBookmark(get().bookmarks, id));
    },
  };
});
