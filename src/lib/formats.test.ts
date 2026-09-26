import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyFormatCacheCleared, getBookPage, getFormatAdapter } from '@/lib/formats';
import { pdfAdapter } from '@/lib/pdfFormat';
import type { PdfBookRecord } from '@/lib/bookTypes';

describe('format registry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the typed adapter for each book type', () => {
    expect(getFormatAdapter('epub').type).toBe('epub');
    expect(getFormatAdapter('pdf').type).toBe('pdf');
  });

  it('dispatches getBookPage without a runtime adapter type guard', async () => {
    const pdf: PdfBookRecord = {
      id: 'p',
      type: 'pdf',
      title: 'P',
      author: '',
      description: '',
      sourceUrl: 'https://example.com/a.pdf',
      coverHref: null,
      coverUrl: null,
      pdfUrl: 'blob:pdf',
      pageCount: 3,
    };
    const page = await getBookPage(pdf, 1);
    expect(page).toEqual({
      type: 'pdf',
      pageNumber: 2,
      pdfUrl: 'blob:pdf',
    });
  });

  it('notifies format adapters when cache is cleared', () => {
    const hook = vi.spyOn(pdfAdapter, 'onCacheCleared');
    notifyFormatCacheCleared('https://example.com/a.pdf');
    notifyFormatCacheCleared(null);
    expect(hook).toHaveBeenCalledWith('https://example.com/a.pdf');
    expect(hook).toHaveBeenCalledWith(null);
  });
});
