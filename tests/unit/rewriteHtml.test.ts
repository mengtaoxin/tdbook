import { describe, expect, it, vi } from 'vitest'
import type { EpubBookRecord } from '@/lib/bookTypes'
import { documentLang, rewritePageHtml } from '@/lib/rewriteHtml'

vi.mock('@/lib/bookCache', () => ({
  getCachedBlobUrl: vi.fn(async (_source: string, path: string) => {
    if (path.endsWith('.css')) return 'data:text/css,/*cached*/'
    if (path.endsWith('.png')) return 'data:image/png;base64,aa=='
    return null
  }),
}))

function epubBook(overrides: Partial<EpubBookRecord> = {}): EpubBookRecord {
  return {
    id: 'sample',
    type: 'epub',
    title: 'Sample',
    author: '',
    description: '',
    sourceUrl: 'https://example.com/a.epub',
    coverHref: null,
    coverUrl: null,
    opfDir: 'OEBPS',
    stylesheetHrefs: ['OEBPS/style.css'],
    pages: [
      {
        id: 'c1',
        href: 'OEBPS/chapter1.xhtml',
        mediaType: 'application/xhtml+xml',
      },
      {
        id: 'c2',
        href: 'OEBPS/chapter2.xhtml',
        mediaType: 'application/xhtml+xml',
      },
    ],
    ...overrides,
  }
}

describe('rewritePageHtml', () => {
  it('rewrites internal chapter links to reader routes and assets to blob URLs', async () => {
    const xhtml = `<?xml version="1.0"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body class="body">
  <p><a href="chapter2.xhtml#sec">Next</a></p>
  <img src="cover.png" alt=""/>
</body></html>`

    const rewritten = await rewritePageHtml(
      xhtml,
      epubBook(),
      'OEBPS/chapter1.xhtml',
      epubBook().pages,
    )

    expect(rewritten.bodyClass).toBe('body')
    expect(rewritten.lang).toBe('en')
    expect(rewritten.stylesheetUrls).toEqual(['data:text/css,/*cached*/'])
    expect(rewritten.html).toContain('/book/sample?page=2#sec')
    expect(rewritten.html).toContain('data:image/png;base64,aa==')
  })

  it('preserves page language from xml:lang / lang', async () => {
    const xhtml = `<?xml version="1.0"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-Hans">
<head></head>
<body><p>你好</p></body></html>`

    const rewritten = await rewritePageHtml(
      xhtml,
      epubBook(),
      'OEBPS/chapter1.xhtml',
      epubBook().pages,
    )

    expect(rewritten.lang).toBe('zh-Hans')
  })
})

describe('documentLang', () => {
  it('prefers body lang over html lang', () => {
    const doc = new DOMParser().parseFromString(
      `<html lang="en"><body lang="fr">x</body></html>`,
      'text/html',
    )
    expect(documentLang(doc)).toBe('fr')
  })

  it('defaults to en when missing', () => {
    const doc = new DOMParser().parseFromString(
      `<html><body>x</body></html>`,
      'text/html',
    )
    expect(documentLang(doc)).toBe('en')
  })
})
