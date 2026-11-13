import { create } from 'zustand';
import {
  getPdfMarginTightenForBook,
  loadPdfMarginTightenByBookId,
  type PdfMarginTightenByBookId,
  setPdfMarginTightenForBook,
  storePdfMarginTightenByBookId,
} from '@/lib/pdfMarginTightenStorage';

type PdfMarginTightenState = {
  byBookId: PdfMarginTightenByBookId;
  get: (bookId: string) => number;
  /** @throws when the write fails; state is left unchanged. */
  set: (bookId: string, value: number) => void;
};

export const usePdfMarginTightenStore = create<PdfMarginTightenState>((set, get) => ({
  byBookId: loadPdfMarginTightenByBookId(),
  get: (bookId) => getPdfMarginTightenForBook(get().byBookId, bookId),
  set: (bookId, value) => {
    const next = setPdfMarginTightenForBook(get().byBookId, bookId, value);
    if (next === get().byBookId) return;
    storePdfMarginTightenByBookId(next);
    set({ byBookId: next });
  },
}));
