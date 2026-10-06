import { create } from 'zustand';
import { listBooks } from '@/lib/bookService';
import type { BookListItem } from '@/lib/bookTypes';
import { invalidateBookConfigsCache, revalidateBookConfigs } from '@/lib/catalog';

type BooksState = {
  books: BookListItem[];
  duplicateIds: string[];
  loading: boolean;
  error: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  invalidate: () => void;
};

let loadGeneration = 0;

export const useBooksStore = create<BooksState>((set, get) => ({
  books: [],
  duplicateIds: [],
  loading: false,
  error: false,
  loaded: false,
  invalidate: () => {
    loadGeneration += 1;
    set({
      books: [],
      duplicateIds: [],
      loading: false,
      error: false,
      loaded: false,
    });
  },
  load: async () => {
    if (get().loading) return;

    const generation = ++loadGeneration;
    const silent = get().loaded;
    if (!silent) set({ loading: true, error: false });

    try {
      const result = await listBooks();
      if (generation !== loadGeneration) return;
      set({
        books: result.books,
        duplicateIds: result.duplicateIds,
        loading: false,
        error: false,
        loaded: true,
      });
    } catch {
      if (generation !== loadGeneration) return;
      if (silent) {
        set({ loading: false });
        return;
      }
      set({
        books: [],
        duplicateIds: [],
        loading: false,
        error: true,
        loaded: false,
      });
      return;
    }

    await refreshFromRemote(generation, set);
  },
}));

/** Swap in the remote catalog after the cached list is already on screen. */
async function refreshFromRemote(
  generation: number,
  set: (partial: Partial<BooksState>) => void,
): Promise<void> {
  try {
    if (!(await revalidateBookConfigs()) || generation !== loadGeneration) return;
    const result = await listBooks();
    if (generation !== loadGeneration) return;
    set({ books: result.books, duplicateIds: result.duplicateIds });
  } catch {
    // Keep the list already shown; the next load revalidates again.
  }
}

/** Drop the in-memory catalog and the book list so the next load re-fetches configs.json. */
export function invalidateCatalog() {
  invalidateBookConfigsCache();
  useBooksStore.getState().invalidate();
}
