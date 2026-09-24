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

export type PersistedBookConfigs = {
  url: string
  books: BookConfig[]
}

const CONFIGS_CACHE_KEY = 'books.configsCache'

let catalogCache: { url: string; result: Promise<BookConfigsResult> } | null =
  null

export function invalidateBookConfigsCache() {
  catalogCache = null
}

/** Last successfully downloaded catalog (any URL), or null if none / unreadable. */
export function getPersistedBookConfigs(): PersistedBookConfigs | null {
  try {
    const raw = localStorage.getItem(CONFIGS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedBookConfigs>
    if (typeof parsed.url !== 'string' || !Array.isArray(parsed.books)) {
      return null
    }
    return { url: parsed.url, books: parsed.books }
  } catch {
    return null
  }
}

export function clearPersistedBookConfigs(): void {
  try {
    localStorage.removeItem(CONFIGS_CACHE_KEY)
  } catch {
    // ignore quota / private-mode failures on clear
  }
}

function persistBookConfigs(url: string, books: BookConfig[]): void {
  try {
    const payload: PersistedBookConfigs = { url, books }
    localStorage.setItem(CONFIGS_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Durable cache is best-effort; in-memory cache still applies.
  }
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

function persistedResultFor(url: string): BookConfigsResult | null {
  const persisted = getPersistedBookConfigs()
  if (!persisted || persisted.url !== url) return null
  return normalizeBookConfigs(persisted.books)
}

async function fetchBookConfigs(url: string): Promise<BookConfigsResult> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return persistedResultFor(url) ?? { books: [], duplicateIds: [] }
    }
    const parsed = (await response.json()) as BookConfigsFile
    const books = parsed.books ?? []
    persistBookConfigs(url, books)
    return normalizeBookConfigs(books)
  } catch {
    return persistedResultFor(url) ?? { books: [], duplicateIds: [] }
  }
}

export async function getBookConfigs(): Promise<BookConfigsResult> {
  const url = getConfigsUrl()
  if (catalogCache?.url === url) return catalogCache.result
  const result = fetchBookConfigs(url)
  catalogCache = { url, result }
  return result
}
