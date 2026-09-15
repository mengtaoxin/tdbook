import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAllCacheRecords,
  getCachedFile,
  isBookCached,
  putFiles,
  putMeta,
  readCachedText,
  resetBlobUrlCacheForTests,
} from '@/lib/cacheStore'
import { extractEpubToCache } from '@/lib/cacheIngest'
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
})
