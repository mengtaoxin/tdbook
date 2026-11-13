import {
  clampPdfMarginTighten,
  isPdfMarginTightenValue,
  PDF_MARGIN_TIGHTEN_DEFAULT,
} from '@/lib/pdfMarginTighten';

export const PDF_MARGIN_TIGHTEN_STORAGE_KEY = 'books.pdfMarginTighten';

export type PdfMarginTightenByBookId = Record<string, number>;

function sanitizeByBookId(value: unknown): PdfMarginTightenByBookId {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const next: PdfMarginTightenByBookId = {};
  for (const [bookId, tighten] of Object.entries(value as Record<string, unknown>)) {
    if (bookId.length === 0) continue;
    if (!isPdfMarginTightenValue(tighten)) continue;
    if (tighten === PDF_MARGIN_TIGHTEN_DEFAULT) continue;
    next[bookId] = tighten;
  }
  return next;
}

/** Per-book PDF margin tighten; invalid / out-of-range entries are dropped. */
export function loadPdfMarginTightenByBookId(): PdfMarginTightenByBookId {
  try {
    const raw = localStorage.getItem(PDF_MARGIN_TIGHTEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { byBookId?: unknown } | null;
    return sanitizeByBookId(parsed?.byBookId);
  } catch {
    return {};
  }
}

/** @throws `errors.localStorageWrite` when the write fails (e.g. quota). */
export function storePdfMarginTightenByBookId(byBookId: PdfMarginTightenByBookId): void {
  try {
    localStorage.setItem(PDF_MARGIN_TIGHTEN_STORAGE_KEY, JSON.stringify({ byBookId }));
  } catch {
    throw new Error('errors.localStorageWrite');
  }
}

export function getPdfMarginTightenForBook(
  byBookId: PdfMarginTightenByBookId,
  bookId: string,
): number {
  const value = byBookId[bookId];
  return isPdfMarginTightenValue(value) ? clampPdfMarginTighten(value) : PDF_MARGIN_TIGHTEN_DEFAULT;
}

/** Returns the next map; setting the default removes the book entry. */
export function setPdfMarginTightenForBook(
  byBookId: PdfMarginTightenByBookId,
  bookId: string,
  value: number,
): PdfMarginTightenByBookId {
  const tighten = clampPdfMarginTighten(value);
  if (tighten === PDF_MARGIN_TIGHTEN_DEFAULT) {
    if (!(bookId in byBookId)) return byBookId;
    const { [bookId]: _removed, ...rest } = byBookId;
    return rest;
  }
  if (byBookId[bookId] === tighten) return byBookId;
  return { ...byBookId, [bookId]: tighten };
}
