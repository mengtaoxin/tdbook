import { describe, expect, it } from 'vitest';
import {
  MAX_RECENT_READS,
  type RecentRead,
  recentReadIds,
  touchRecentRead,
} from '@/lib/recentReads';
import en from '@/i18n/locales/en';
import zh from '@/i18n/locales/zh';

function touchMany(list: RecentRead[], bookIds: string[], startAt = 1000): RecentRead[] {
  let next = list;
  for (let i = 0; i < bookIds.length; i += 1) {
    next = touchRecentRead(next, bookIds[i]!, startAt + i);
  }
  return next;
}

describe('recentReads', () => {
  it('adds a first open at the front of the sticky list', () => {
    const list = touchRecentRead([], 'sample-epub', 1000);

    expect(list).toEqual([{ bookId: 'sample-epub', enteredAt: 1000, lastAccessedAt: 1000 }]);
    expect(recentReadIds(list)).toEqual(['sample-epub']);
  });

  it('keeps display order when reopening a book already on the list', () => {
    const opened = touchMany([], ['a', 'b'], 1000);
    expect(recentReadIds(opened)).toEqual(['b', 'a']);

    const reopened = touchRecentRead(opened, 'a', 3000);

    expect(recentReadIds(reopened)).toEqual(['b', 'a']);
    expect(reopened.find((item) => item.bookId === 'a')).toEqual({
      bookId: 'a',
      enteredAt: 1000,
      lastAccessedAt: 3000,
    });
    expect(reopened.find((item) => item.bookId === 'b')?.lastAccessedAt).toBe(1001);
  });

  it('puts a brand-new book at the front without reshuffling the rest', () => {
    const opened = touchMany([], ['a', 'b'], 1000);
    const next = touchRecentRead(opened, 'c', 2000);

    expect(recentReadIds(next)).toEqual(['c', 'b', 'a']);
  });

  it(`keeps at most ${MAX_RECENT_READS} books and evicts the least recently accessed`, () => {
    const ids = Array.from({ length: MAX_RECENT_READS }, (_, i) => `book-${i}`);
    const full = touchMany([], ids, 1000);
    // Refresh an early book so it is not the eviction victim.
    const refreshed = touchRecentRead(full, 'book-0', 5000);
    const next = touchRecentRead(refreshed, 'book-new', 6000);

    expect(recentReadIds(next)).toHaveLength(MAX_RECENT_READS);
    expect(recentReadIds(next)[0]).toBe('book-new');
    expect(recentReadIds(next)).toContain('book-0');
    expect(recentReadIds(next)).not.toContain('book-1');
  });

  it('keeps en/zh books.recent keys in sync', () => {
    expect(Object.keys(zh.books).sort()).toEqual(Object.keys(en.books).sort());
  });
});
