import { beforeEach, describe, expect, it } from 'vitest';
import type { RecentRead } from '@/lib/recentReads';
import {
  loadRecentReads,
  RECENT_READS_STORAGE_KEY,
  storeRecentReads,
} from '@/lib/recentReadStorage';

const sample: RecentRead = {
  bookId: 'sample-epub',
  enteredAt: 1000,
  lastAccessedAt: 2000,
};

describe('recentReadStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    expect(loadRecentReads()).toEqual([]);
  });

  it('round-trips stored recent reads', () => {
    storeRecentReads([sample]);
    expect(JSON.parse(localStorage.getItem(RECENT_READS_STORAGE_KEY) ?? '')).toEqual({
      recentReads: [sample],
    });
    expect(loadRecentReads()).toEqual([sample]);
  });

  it('reads damaged JSON as empty', () => {
    localStorage.setItem(RECENT_READS_STORAGE_KEY, '{');
    expect(loadRecentReads()).toEqual([]);
  });

  it('drops records that do not match the current shape', () => {
    localStorage.setItem(
      RECENT_READS_STORAGE_KEY,
      JSON.stringify({
        recentReads: [
          { bookId: '', enteredAt: 1, lastAccessedAt: 1 },
          { bookId: 'x', enteredAt: 'nope', lastAccessedAt: 1 },
          sample,
        ],
      }),
    );
    expect(loadRecentReads()).toEqual([sample]);
  });
});
