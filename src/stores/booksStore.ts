import { create } from 'zustand'
import { listBooks } from '@/lib/bookService'
import type { BookListItem } from '@/lib/bookTypes'

type BooksState = {
  books: BookListItem[]
  duplicateIds: string[]
  loading: boolean
  error: boolean
  loaded: boolean
  load: () => Promise<void>
  invalidate: () => void
}

let loadGeneration = 0

export const useBooksStore = create<BooksState>((set, get) => ({
  books: [],
  duplicateIds: [],
  loading: false,
  error: false,
  loaded: false,
  invalidate: () => {
    loadGeneration += 1
    set({
      books: [],
      duplicateIds: [],
      loading: false,
      error: false,
      loaded: false,
    })
  },
  load: async () => {
    if (get().loading) return
    if (get().loaded) return

    const generation = ++loadGeneration
    set({ loading: true, error: false })

    try {
      const result = await listBooks()
      if (generation !== loadGeneration) return
      set({
        books: result.books,
        duplicateIds: result.duplicateIds,
        loading: false,
        error: false,
        loaded: true,
      })
    } catch {
      if (generation !== loadGeneration) return
      set({
        books: [],
        duplicateIds: [],
        loading: false,
        error: true,
        loaded: false,
      })
    }
  },
}))
