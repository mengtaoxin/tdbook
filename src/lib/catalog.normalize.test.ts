import { describe, expect, it } from 'vitest';
import { normalizeBookConfigs, type BookConfig } from '@/lib/catalog';

function cfg(partial: Partial<BookConfig> & Pick<BookConfig, 'id' | 'url'>): BookConfig {
  return {
    title: partial.title ?? partial.id,
    type: partial.type ?? 'epub',
    ...partial,
  };
}

describe('normalizeBookConfigs', () => {
  it('keeps remote and site-absolute paths; drops invalid entries', () => {
    const { books, duplicateIds } = normalizeBookConfigs([
      cfg({ id: 'ok', url: 'https://example.com/a.epub' }),
      cfg({ id: 'site', url: '/books/local.epub' }),
      cfg({ id: 'bad-path', url: 'relative/a.epub' }),
      cfg({ id: 'bad-type', url: 'https://example.com/b.epub', type: 'mobi' }),
      cfg({ id: '../x', url: 'https://example.com/c.epub' }),
      cfg({ id: 'proto-rel', url: '//evil.example/x.epub' }),
    ]);

    expect(books.map((b) => b.id)).toEqual(['ok', 'site']);
    expect(duplicateIds).toEqual([]);
  });

  it('keeps the first duplicate id and reports it', () => {
    const { books, duplicateIds } = normalizeBookConfigs([
      cfg({ id: 'dup', title: 'First', url: 'https://example.com/1.epub' }),
      cfg({ id: 'dup', title: 'Second', url: 'https://example.com/2.epub' }),
      cfg({ id: 'other', url: 'https://example.com/3.pdf', type: 'pdf' }),
    ]);

    expect(books).toHaveLength(2);
    expect(books[0]?.title).toBe('First');
    expect(duplicateIds).toEqual(['dup']);
  });

  it('keeps remote and site-absolute hover URLs; strips invalid ones', () => {
    const { books } = normalizeBookConfigs([
      cfg({
        id: 'remote',
        url: 'https://example.com/a.epub',
        hover: 'https://cdn.example.com/cover.jpg',
      }),
      cfg({
        id: 'site',
        url: 'https://example.com/b.epub',
        hover: '/covers/site.webp',
      }),
      cfg({
        id: 'bad',
        url: 'https://example.com/c.epub',
        hover: '../escape.png',
      }),
      cfg({
        id: 'protocol-relative',
        url: 'https://example.com/d.epub',
        hover: '//evil.example/x.png',
      }),
    ]);
    expect(books.find((b) => b.id === 'remote')?.hover).toBe('https://cdn.example.com/cover.jpg');
    expect(books.find((b) => b.id === 'site')?.hover).toBe('/covers/site.webp');
    expect(books.find((b) => b.id === 'bad')?.hover).toBeUndefined();
    expect(books.find((b) => b.id === 'protocol-relative')?.hover).toBeUndefined();
  });
});
