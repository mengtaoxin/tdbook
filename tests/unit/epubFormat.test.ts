import { beforeEach, describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import {
  clearAllCacheRecords,
  putFiles,
  putMeta,
  resetBlobUrlCacheForTests,
} from '@/lib/cacheStore'
import { epubAdapter } from '@/lib/epubFormat'

async function seedSampleEpub(sourceUrl: string) {
  const zip = new JSZip()
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0"?>
<package version="3.0" unique-identifier="uid" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>From OPF</dc:title>
    <dc:creator>OPF Author</dc:creator>
    <meta name="cover" content="cover-img"/>
  </metadata>
  <manifest>
    <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
    <item id="cover-img" href="cover.png" media-type="image/png"/>
  </manifest>
  <spine><itemref idref="c1"/></spine>
</package>`,
  )
  zip.file(
    'OEBPS/c1.xhtml',
    `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><p>Hi</p></body></html>`,
  )
  zip.file('OEBPS/style.css', 'p{}')
  zip.file('OEBPS/cover.png', new Uint8Array([137, 80, 78, 71]))

  const entries = await Promise.all(
    Object.values(zip.files)
      .filter((f) => !f.dir)
      .map(async (entry) => ({
        relativePath: entry.name,
        blob: new Blob([await entry.async('uint8array')]),
      })),
  )
  await putFiles(sourceUrl, entries)
  await putMeta({
    sourceUrl,
    type: 'epub',
    id: 'sample-epub',
    status: 'ready',
    downloadedAt: Date.now(),
  })
}

describe('epubAdapter', () => {
  const sourceUrl = 'https://example.com/sample.epub'

  beforeEach(async () => {
    resetBlobUrlCacheForTests()
    await clearAllCacheRecords()
    await seedSampleEpub(sourceUrl)
  })

  it('opens a cached EPUB into a typed EpubBookRecord', async () => {
    const book = await epubAdapter.open('sample-epub', {
      id: 'sample-epub',
      title: 'Fallback',
      path: sourceUrl,
      type: 'epub',
    })

    expect(book?.type).toBe('epub')
    expect(book?.title).toBe('From OPF')
    expect(book?.author).toBe('OPF Author')
    expect(book?.pages).toHaveLength(1)
    expect(book?.pages[0]?.href).toBe('OEBPS/c1.xhtml')
    if (book?.type === 'epub') {
      expect(book.opfDir).toBe('OEBPS')
      expect(book.stylesheetHrefs).toContain('OEBPS/style.css')
      expect(book.coverHref).toBe('OEBPS/cover.png')
      expect(book.coverUrl).toMatch(/^blob:/)
      expect('pdfUrl' in book).toBe(false)
    }
  })

  it('returns epub page content via getPage', async () => {
    const book = await epubAdapter.open('sample-epub', {
      id: 'sample-epub',
      title: 'Fallback',
      path: sourceUrl,
      type: 'epub',
    })
    expect(book).not.toBeNull()
    const page = await epubAdapter.getPage(book!, 0)
    expect(page?.type).toBe('epub')
    if (page?.type === 'epub') {
      expect(page.rewritten.html).toContain('Hi')
    }
  })

  it('extracts cover without assembling a full reader record path beyond OPF', async () => {
    const cover = await epubAdapter.extractCover({
      id: 'sample-epub',
      title: 'Fallback',
      path: sourceUrl,
      type: 'epub',
    })
    expect(cover).toMatch(/^blob:/)
  })
})
