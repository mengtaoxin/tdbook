import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAllCacheRecords,
  deleteBookCacheRecords,
  getCachedFile,
  isBookCached,
  putFiles,
  putMeta,
  readCachedText,
  resetBlobUrlCacheForTests,
} from '@/lib/cacheStore'
import { extractEpubToCache } from '@/lib/epubIngest'
import JSZip from 'jszip'

describe('cacheStore + cacheIngest', () => {
  beforeEach(async () => {
    resetBlobUrlCacheForTests()
    await clearAllCacheRecords()
  })

  it('stores and reads files by sourceUrl + relative path', async () => {
    const sourceUrl = 'https://example.com/book.epub'
    await putFiles(sourceUrl, [
      { relativePath: 'OEBPS/a.xhtml', blob: new Blob(['hello'], { type: 'text/html' }) },
    ])
    await putMeta({
      sourceUrl,
      type: 'epub',
      id: 'book',
      status: 'ready',
      downloadedAt: Date.now(),
    })

    expect(await isBookCached(sourceUrl)).toBe(true)
    expect(await readCachedText(sourceUrl, 'OEBPS/a.xhtml')).toBe('hello')
    expect(await getCachedFile(sourceUrl, 'missing')).toBeNull()
  })

  it('extracts an EPUB zip into individual cached files', async () => {
    const zip = new JSZip()
    zip.file('META-INF/container.xml', '<container/>')
    zip.file('OEBPS/content.opf', '<package/>')
    const blob = await zip.generateAsync({ type: 'blob' })
    const sourceUrl = 'https://example.com/sample.epub'

    await extractEpubToCache(sourceUrl, blob)
    expect(await readCachedText(sourceUrl, 'META-INF/container.xml')).toContain(
      'container',
    )
    expect(await readCachedText(sourceUrl, 'OEBPS/content.opf')).toContain('package')
  })

  it('deletes one source without touching another', async () => {
    const a = 'https://example.com/a.epub'
    const b = 'https://example.com/b.epub'
    await putFiles(a, [{ relativePath: 'x', blob: new Blob(['a']) }])
    await putFiles(b, [{ relativePath: 'x', blob: new Blob(['b']) }])
    await putMeta({
      sourceUrl: a,
      type: 'epub',
      id: 'a',
      status: 'ready',
      downloadedAt: Date.now(),
    })
    await putMeta({
      sourceUrl: b,
      type: 'epub',
      id: 'b',
      status: 'ready',
      downloadedAt: Date.now(),
    })

    await deleteBookCacheRecords(a)

    expect(await isBookCached(a)).toBe(false)
    expect(await isBookCached(b)).toBe(true)
    expect(await readCachedText(a, 'x')).toBeNull()
    expect(await readCachedText(b, 'x')).toBe('b')
  })
})
