import { create } from 'zustand';
import { touchRecentRead, type RecentRead } from '@/lib/recentReads';
import { loadRecentReads, storeRecentReads } from '@/lib/recentReadStorage';

type RecentReadsState = {
  recentReads: RecentRead[];
  /**
   * Record a successful open. Throws `errors.localStorageWrite` on persist
   * failure and leaves state unchanged.
   */
  touch: (bookId: string) => void;
};

export const useRecentReadsStore = create<RecentReadsState>((set, get) => ({
  recentReads: loadRecentReads(),
  touch: (bookId) => {
    const next = touchRecentRead(get().recentReads, bookId, Date.now());
    storeRecentReads(next);
    set({ recentReads: next });
  },
}));
