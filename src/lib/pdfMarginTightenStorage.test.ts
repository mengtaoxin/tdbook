import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPdfMarginTightenForBook,
  loadPdfMarginTightenByBookId,
  PDF_MARGIN_TIGHTEN_STORAGE_KEY,
  setPdfMarginTightenForBook,
  storePdfMarginTightenByBookId,
} from '@/lib/pdfMarginTightenStorage';

describe('pdfMarginTightenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts empty and returns the default for unknown books', () => {
    expect(loadPdfMarginTightenByBookId()).toEqual({});
    expect(getPdfMarginTightenForBook({}, 'sample-pdf')).toBe(0);
  });

  it('round-trips stored tighten values', () => {
    storePdfMarginTightenByBookId({ 'sample-pdf': 0.1 });
    expect(JSON.parse(localStorage.getItem(PDF_MARGIN_TIGHTEN_STORAGE_KEY) ?? '')).toEqual({
      byBookId: { 'sample-pdf': 0.1 },
    });
    expect(loadPdfMarginTightenByBookId()).toEqual({ 'sample-pdf': 0.1 });
    expect(getPdfMarginTightenForBook(loadPdfMarginTightenByBookId(), 'sample-pdf')).toBe(0.1);
  });

  it('removes a book entry when set back to the default', () => {
    const next = setPdfMarginTightenForBook({ 'sample-pdf': 0.1 }, 'sample-pdf', 0);
    expect(next).toEqual({});
  });

  it('reads damaged JSON as empty and drops invalid entries', () => {
    localStorage.setItem(PDF_MARGIN_TIGHTEN_STORAGE_KEY, '{');
    expect(loadPdfMarginTightenByBookId()).toEqual({});

    localStorage.setItem(
      PDF_MARGIN_TIGHTEN_STORAGE_KEY,
      JSON.stringify({
        byBookId: {
          '': 0.1,
          bad: 'nope',
          over: 0.9,
          ok: 0.05,
        },
      }),
    );
    expect(loadPdfMarginTightenByBookId()).toEqual({ ok: 0.05 });
  });

  it('throws when the write fails', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => storePdfMarginTightenByBookId({ a: 0.1 })).toThrow('errors.localStorageWrite');
  });
});
