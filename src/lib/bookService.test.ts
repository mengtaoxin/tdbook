import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBook, listBooks } from '@/lib/bookService';
import { invalidateBookConfigsCache } from '@/lib/catalog';
import {
  clearAllCacheRecords,
  getBookCacheMeta,
  putFiles,
  putMeta,
  resetBlobUrlCacheForTests,
} from '@/lib/cacheStore';
import * as epubPackage from '@/lib/epubPackage';

const catalog = {
  books: [
    {
      id: 'sample-epub',
      title: 'Sample EPUB',
      type: 'epub',
      path: 'https://example.com/sample.epub',
    },
  ],
};

describe('listBooks / getBook cache snapshot', () => {
  beforeEach(async () => {
    resetBlobUrlCacheForTests();
    await clearAllCacheRecords();
    invalidateBookConfigsCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/configs.json') || url === '/configs.json') {
          return new Response(JSON.stringify(catalog), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('missing', { status: 404 });
      }),
    );
  });

  afterEach(() => {
    invalidateBookConfigsCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses stored coverPath on the list without parsing OPF', async () => {
    const sourceUrl = 'https://example.com/sample.epub';
    await putFiles(sourceUrl, [
      { relativePath: 'OEBPS/cover.png', blob: new Blob([new Uint8Array([1, 2])]) },
    ]);
    await putMeta({
      sourceUrl,
      type: 'epub',
      id: 'sample-epub',
      status: 'ready',
      downloadedAt: Date.now(),
      pageCount: 1,
      coverPath: 'OEBPS/cover.png',
    });

    const parse = vi.spyOn(epubPackage, 'parseCachedEpubPackage');
    const { books } = await listBooks();
    expect(parse).not.toHaveBeenCalled();
    expect(books[0]?.cached).toBe(true);
    expect(books[0]?.coverUrl).toMatch(/^blob:/);

    await listBooks();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('backfills snapshot meta when coverPath is missing', async () => {
    const sourceUrl = 'https://example.com/sample.epub';
    await putFiles(sourceUrl, [
      {
        relativePath: 'META-INF/container.xml',
        blob: new Blob([
          `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
        ]),
      },
      {
        relativePath: 'content.opf',
        blob: new Blob([
          `<?xml version="1.0"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>T</dc:title>
    <meta name="cover" content="cover-img"/>
  </metadata>
  <manifest>
    <item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/>
    <item id="cover-img" href="cover.png" media-type="image/png"/>
  </manifest>
  <spine><itemref idref="c1"/></spine>
</package>`,
        ]),
      },
      {
        relativePath: 'c1.xhtml',
        blob: new Blob(['<html><body>Hi</body></html>']),
      },
      {
        relativePath: 'cover.png',
        blob: new Blob([new Uint8Array([137, 80, 78, 71])]),
      },
    ]);
    await putMeta({
      sourceUrl,
      type: 'epub',
      id: 'sample-epub',
      status: 'ready',
      downloadedAt: Date.now(),
    });

    const { books } = await listBooks();
    expect(books[0]?.coverUrl).toMatch(/^blob:/);
    const meta = await getBookCacheMeta(sourceUrl);
    expect(meta?.coverPath).toBe('cover.png');
    expect(meta?.pageCount).toBe(1);
  });

  it('returns null from getBook for an unknown id', async () => {
    expect(await getBook('missing-id')).toBeNull();
  });
});
