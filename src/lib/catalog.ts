import { isCatalogResourcePath, isSafeSegment } from './paths'
import { getConfigsUrl } from './settings'
import type { BookType } from './bookTypes'

export type BookConfig = {
  id: string
  title: string
  /** Optional; omit or "" when unknown. */
  author?: string
  type?: string
  /** Remote `http(s)://…` or site-absolute `/…` (e.g. under `public/`). */
  path: string
  /** Optional cover image: `http(s)://…` or site path `/…` (e.g. under `public/`). */
  hover?: string
}

type BookConfigsFile = {
  books: BookConfig[]
}

export type BookConfigsResult = {
  books: BookConfig[]
  duplicateIds: string[]
}

/** Accept `http(s)://…` or same-origin `/…` cover paths; ignore anything else. */
export function optionalCoverUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return isCatalogResourcePath(trimmed) ? trimmed : undefined
}

export function bookTypeOf(config: BookConfig): BookType {
  return config.type === 'pdf' ? 'pdf' : 'epub'
}

export function normalizeBookConfigs(books: BookConfig[]): BookConfigsResult {
  const seen = new Set<string>()
  const duplicateIds: string[] = []
  const deduped: BookConfig[] = []

  for (const book of books) {
    const type = book.type ?? 'epub'
    if (
      typeof book.id !== 'string' ||
      !isSafeSegment(book.id) ||
      (type !== 'epub' && type !== 'pdf') ||
      typeof book.path !== 'string' ||
      !isCatalogResourcePath(book.path)
    ) {
      continue
    }

    if (seen.has(book.id)) {
      if (!duplicateIds.includes(book.id)) {
        duplicateIds.push(book.id)
      }
      continue
    }

    seen.add(book.id)
    deduped.push({
      ...book,
      path: book.path.trim(),
      hover: optionalCoverUrl(book.hover),
    })
  }

  return { books: deduped, duplicateIds }
}

export async function getBookConfigs(): Promise<BookConfigsResult> {
  try {
    const response = await fetch(getConfigsUrl())
    if (!response.ok) return { books: [], duplicateIds: [] }
    const parsed = (await response.json()) as BookConfigsFile
    return normalizeBookConfigs(parsed.books ?? [])
  } catch {
    return { books: [], duplicateIds: [] }
  }
}
