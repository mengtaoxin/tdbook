import { describe, expect, it } from 'vitest'
import { bookPageCount, type BookRecord } from '@/lib/bookTypes'

describe('bookPageCount', () => {
  it('uses spine length for EPUB and pageCount for PDF', () => {
    const epub: BookRecord = {
      id: 'e',
      type: 'epub',
      title: 'E',
      author: '',
      description: '',
      sourceUrl: 'https://example.com/a.epub',
      coverHref: null,
      coverUrl: null,
      opfDir: '',
      stylesheetHrefs: [],
      pages: [
        { id: '1', href: 'a.xhtml', mediaType: 'application/xhtml+xml' },
        { id: '2', href: 'b.xhtml', mediaType: 'application/xhtml+xml' },
      ],
    }
    const pdf: BookRecord = {
      id: 'p',
      type: 'pdf',
      title: 'P',
      author: '',
      description: '',
      sourceUrl: 'https://example.com/a.pdf',
      coverHref: null,
      coverUrl: null,
      pdfUrl: 'blob:pdf',
      pageCount: 7,
    }

    expect(bookPageCount(epub)).toBe(2)
    expect(bookPageCount(pdf)).toBe(7)
  })
})
