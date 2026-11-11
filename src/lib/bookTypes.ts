export type BookType = 'epub' | 'pdf';

export type BookPage = {
  id: string;
  href: string;
  mediaType: string;
};

type BookRecordBase = {
  /** Catalog identity; same as configs.json `id` and route `/book/:id`. */
  id: string;
  title: string;
  author: string;
  description: string;
  /** Catalog source URL/path; used as IndexedDB cache key. */
  sourceUrl: string;
  coverHref: string | null;
  coverUrl: string | null;
};

export type EpubBookRecord = BookRecordBase & {
  type: 'epub';
  /** Directory of the OPF within the EPUB package ('' if OPF is at root). */
  opfDir: string;
  stylesheetHrefs: string[];
  pages: BookPage[];
};

export type PdfBookRecord = BookRecordBase & {
  type: 'pdf';
  pdfUrl: string;
  pageCount: number;
};

export type BookRecord = EpubBookRecord | PdfBookRecord;

export type BookListItem = {
  id: string;
  type: BookType;
  title: string;
  author: string;
  sourceUrl: string;
  cached: boolean;
  coverUrl: string | null;
};

export function bookPageCount(book: BookRecord): number {
  return book.type === 'epub' ? book.pages.length : book.pageCount;
}
