import { isBookCached, type CacheProgress } from './bookCache'
import type { BookListItem, BookRecord } from './bookTypes'
import {
  bookTypeOf,
  getBookConfigs,
  optionalCoverUrl,
  type BookConfig,
} from './catalog'
import { getFormatAdapter } from './formats'
import { isSafeSegment } from './paths'

function resolveCoverUrl(
  config: BookConfig,
  extracted: string | null,
): string | null {
  return optionalCoverUrl(config.hover) ?? extracted
}

export async function getBook(
  id: string,
  onProgress?: (progress: CacheProgress) => void,
): Promise<BookRecord | null> {
  if (!isSafeSegment(id)) return null

  const { books: configs } = await getBookConfigs()
  const config = configs.find((book) => book.id === id)
  if (!config) return null

  const adapter = getFormatAdapter(bookTypeOf(config))

  try {
    await adapter.ensure(config.path, config.id, onProgress)
  } catch (error) {
    throw error instanceof Error ? error : new Error('errors.cacheBookFailed')
  }

  const record = await adapter.open(id, config)
  if (!record) return null
  record.coverUrl = resolveCoverUrl(config, record.coverUrl)
  return record
}

export type BookListResult = {
  books: BookListItem[]
  duplicateIds: string[]
}

export async function listBooks(): Promise<BookListResult> {
  const { books: configs, duplicateIds } = await getBookConfigs()

  const books = await Promise.all(
    configs.map(async (config) => {
      const type = bookTypeOf(config)
      const adapter = getFormatAdapter(type)
      const cached = await isBookCached(config.path)
      let extractedCover: string | null = null

      if (!optionalCoverUrl(config.hover) && cached) {
        try {
          extractedCover = await adapter.extractCover(config)
        } catch {
          extractedCover = null
        }
      }

      return {
        id: config.id,
        type,
        title: config.title,
        author: (config.author ?? '').trim(),
        sourceUrl: config.path,
        cached,
        coverUrl: resolveCoverUrl(config, extractedCover),
      }
    }),
  )

  return { books, duplicateIds }
}
