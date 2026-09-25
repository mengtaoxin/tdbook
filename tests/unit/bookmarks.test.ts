import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_BOOKMARK_NAME,
  getDefaultBookmark,
  listBookmarks,
  readerBookIdFromPath,
  saveDefaultBookmark,
} from '@/lib/bookmarks'

const STORAGE_KEY = 'books.bookmarks'

describe('bookmarks', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('recognizes a reader route and ignores other paths', () => {
    expect(readerBookIdFromPath('/book/sample-epub')).toBe('sample-epub')
    expect(readerBookIdFromPath('/book/a%20b')).toBe('a b')
    expect(readerBookIdFromPath('/books')).toBeNull()
    expect(readerBookIdFromPath('/book')).toBeNull()
    expect(readerBookIdFromPath('/book/sample-epub/extra')).toBeNull()
  })

  it('starts with no default bookmark', () => {
    expect(listBookmarks()).toEqual([])
    expect(getDefaultBookmark('sample-epub')).toBeNull()
  })

  it('saves the current page and location as the only default bookmark', () => {
    const saved = saveDefaultBookmark({
      bookId: 'sample-epub',
      page: 2,
      location: '#chapter',
    })

    expect(saved).toEqual({
      'book-id': 'sample-epub',
      isDefault: true,
      location: '#chapter',
      name: DEFAULT_BOOKMARK_NAME,
      page: 2,
    })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({
      bookmarks: [saved],
    })
    expect(getDefaultBookmark('sample-epub')).toEqual(saved)
  })

  it('updates page and location without renaming the default bookmark', () => {
    saveDefaultBookmark({
      bookId: 'sample-epub',
      page: 1,
      location: '',
      name: '默认书签',
    })

    const updated = saveDefaultBookmark({
      bookId: 'sample-epub',
      page: 4,
      location: '#later',
      name: 'renamed',
    })

    expect(updated.name).toBe('默认书签')
    expect(updated.page).toBe(4)
    expect(updated.location).toBe('#later')
    expect(listBookmarks()).toHaveLength(1)
    expect(listBookmarks().filter((item) => item.isDefault)).toHaveLength(1)
  })

  it('keeps other books and non-default bookmarks when updating a default', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bookmarks: [
          {
            'book-id': 'sample-epub',
            isDefault: false,
            location: '#note',
            name: 'margin',
            page: 1,
          },
          {
            'book-id': 'sample-pdf',
            isDefault: true,
            location: '',
            name: DEFAULT_BOOKMARK_NAME,
            page: 3,
          },
        ],
      }),
    )

    saveDefaultBookmark({
      bookId: 'sample-epub',
      page: 2,
      location: '',
    })

    const bookmarks = listBookmarks()
    expect(bookmarks).toHaveLength(3)
    expect(getDefaultBookmark('sample-pdf')?.page).toBe(3)
    expect(bookmarks.filter((item) => item['book-id'] === 'sample-epub' && item.isDefault)).toHaveLength(1)
    expect(bookmarks.find((item) => item.name === 'margin')).toMatchObject({
      isDefault: false,
      page: 1,
    })
  })

  it('returns null for a missing or unreadable store', () => {
    localStorage.setItem(STORAGE_KEY, '{')
    expect(listBookmarks()).toEqual([])
    expect(getDefaultBookmark('sample-epub')).toBeNull()
  })
})
