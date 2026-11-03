import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRecentReads } from '@/lib/recentReadStorage';
import { useRecentReadsStore } from '@/stores/recentReadsStore';

describe('recentReadsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentReadsStore.setState({ recentReads: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists a touch into localStorage', () => {
    useRecentReadsStore.getState().touch('sample-epub');
    const [saved] = useRecentReadsStore.getState().recentReads;
    expect(saved?.bookId).toBe('sample-epub');
    expect(loadRecentReads()).toEqual([saved]);
  });

  it('keeps state unchanged when the write fails', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => useRecentReadsStore.getState().touch('sample-epub')).toThrow(
      'errors.localStorageWrite',
    );
    expect(useRecentReadsStore.getState().recentReads).toEqual([]);
  });
});
