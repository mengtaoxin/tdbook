export const BOOKMARKS_STORAGE_KEY = 'books.bookmarks'

/** Fixed label for a new default bookmark. Existing names are never rewritten. */
export const DEFAULT_BOOKMARK_NAME = 'Default bookmark'

export type Bookmark = {
  'book-id': string
  isDefault: boolean
  location: string
  name: string
  page: number
}

type BookmarkStore = {
  bookmarks: Bookmark[]
}

export function readerBookIdFromPath(pathname: string): string | null {
  const match = /^\/book\/([^/]+)$/.exec(pathname)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item['book-id'] === 'string' &&
    item['book-id'].length > 0 &&
    typeof item.isDefault === 'boolean' &&
    typeof item.location === 'string' &&
    typeof item.name === 'string' &&
    item.name.length > 0 &&
    Number.isInteger(item.page) &&
    (item.page as number) >= 1
  )
}

/** One default bookmark per book; the first default wins. */
function normalize(bookmarks: Bookmark[]): Bookmark[] {
  const seenDefault = new Set<string>()
  return bookmarks.map((bookmark) => {
    if (!bookmark.isDefault) return bookmark
    const bookId = bookmark['book-id']
    if (seenDefault.has(bookId)) return { ...bookmark, isDefault: false }
    seenDefault.add(bookId)
    return bookmark
  })
}

export function listBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return []
    const bookmarks = (parsed as { bookmarks?: unknown }).bookmarks
    if (!Array.isArray(bookmarks)) return []
    return normalize(bookmarks.filter(isBookmark))
  } catch {
    return []
  }
}

export function getDefaultBookmark(bookId: string): Bookmark | null {
  return (
    listBookmarks().find(
      (bookmark) => bookmark['book-id'] === bookId && bookmark.isDefault,
    ) ?? null
  )
}

function writeStore(store: BookmarkStore): void {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(store))
  } catch {
    throw new Error('errors.localStorageWrite')
  }
}

/**
 * Create or update the single default bookmark for a book.
 * A later save changes page and location only; the name stays as first stored.
 */
export function saveDefaultBookmark(input: {
  bookId: string
  page: number
  location: string
  name?: string
}): Bookmark {
  const bookId = input.bookId.trim()
  if (!bookId || !Number.isInteger(input.page) || input.page < 1) {
    throw new Error('errors.invalidBookmark')
  }

  const current = listBookmarks()
  const existing = current.find(
    (bookmark) => bookmark['book-id'] === bookId && bookmark.isDefault,
  )
  const next: Bookmark = existing
    ? {
        ...existing,
        location: input.location,
        page: input.page,
      }
    : {
        'book-id': bookId,
        isDefault: true,
        location: input.location,
        name: input.name?.trim() || DEFAULT_BOOKMARK_NAME,
        page: input.page,
      }
  const kept = current.filter(
    (bookmark) => !(bookmark['book-id'] === bookId && bookmark.isDefault),
  )
  writeStore({ bookmarks: normalize([...kept, next]) })
  return next
}
