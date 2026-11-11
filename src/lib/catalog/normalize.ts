import type { BookType } from '../bookTypes';
import { isCatalogResourcePath, isSafeSegment } from '../paths';
import type { BookConfig, BookConfigsResult } from './types';

/** Accept `http(s)://…` or same-origin `/…` cover paths; ignore anything else. */
export function optionalCoverUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return isCatalogResourcePath(trimmed) ? trimmed : undefined;
}

export function bookTypeOf(config: BookConfig): BookType {
  return config.type === 'pdf' ? 'pdf' : 'epub';
}

export function normalizeBookConfigs(books: BookConfig[]): BookConfigsResult {
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  const deduped: BookConfig[] = [];

  for (const book of books) {
    const type = book.type ?? 'epub';
    if (
      typeof book.id !== 'string' ||
      !isSafeSegment(book.id) ||
      (type !== 'epub' && type !== 'pdf') ||
      typeof book.path !== 'string' ||
      !isCatalogResourcePath(book.path)
    ) {
      continue;
    }

    if (seen.has(book.id)) {
      if (!duplicateIds.includes(book.id)) {
        duplicateIds.push(book.id);
      }
      continue;
    }

    seen.add(book.id);
    deduped.push({
      ...book,
      path: book.path.trim(),
      hover: optionalCoverUrl(book.hover),
    });
  }

  return { books: deduped, duplicateIds };
}
