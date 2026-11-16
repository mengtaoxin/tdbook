import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPdfMarginTightenByBookId } from '@/lib/pdfMarginTightenStorage';
import { usePdfMarginTightenStore } from '@/stores/pdfMarginTightenStore';

describe('pdfMarginTightenStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePdfMarginTightenStore.setState({ byBookId: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the default and persists a set for a book', () => {
    expect(usePdfMarginTightenStore.getState().get('sample-pdf')).toBe(0);
    usePdfMarginTightenStore.getState().set('sample-pdf', 0.1);
    expect(usePdfMarginTightenStore.getState().get('sample-pdf')).toBe(0.1);
    expect(loadPdfMarginTightenByBookId()).toEqual({ 'sample-pdf': 0.1 });
  });

  it('removes the book entry when set back to the default', () => {
    usePdfMarginTightenStore.getState().set('sample-pdf', 0.1);
    usePdfMarginTightenStore.getState().set('sample-pdf', 0);
    expect(usePdfMarginTightenStore.getState().get('sample-pdf')).toBe(0);
    expect(loadPdfMarginTightenByBookId()).toEqual({});
  });

  it('keeps state unchanged when the write fails', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => usePdfMarginTightenStore.getState().set('sample-pdf', 0.1)).toThrow(
      'errors.localStorageWrite',
    );
    expect(usePdfMarginTightenStore.getState().byBookId).toEqual({});
  });
});
