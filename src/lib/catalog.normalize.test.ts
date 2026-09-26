import { describe, expect, it } from 'vitest';
import { normalizeBookConfigs, type BookConfig } from '@/lib/catalog';

function cfg(partial: Partial<BookConfig> & Pick<BookConfig, 'id' | 'path'>): BookConfig {
  return {
    title: partial.title ?? partial.id,
    type: partial.type ?? 'epub',
    ...partial,
  };
}

describe('normalizeBookConfigs', () => {
  it('keeps remote and site-absolute paths; drops invalid entries', () => {
    const { books, duplicateIds } = normalizeBookConfigs([
      cfg({ id: 'ok', path: 'https://example.com/a.epub' }),
      cfg({ id: 'site', path: '/books/local.epub' }),
      cfg({ id: 'bad-path', path: 'relative/a.epub' }),
      cfg({ id: 'bad-type', path: 'https://example.com/b.epub', type: 'mobi' }),
      cfg({ id: '../x', path: 'https://example.com/c.epub' }),
      cfg({ id: 'proto-rel', path: '//evil.example/x.epub' }),
    ]);

    expect(books.map((b) => b.id)).toEqual(['ok', 'site']);
    expect(duplicateIds).toEqual([]);
  });

  it('keeps the first duplicate id and reports it', () => {
    const { books, duplicateIds } = normalizeBookConfigs([
      cfg({ id: 'dup', title: 'First', path: 'https://example.com/1.epub' }),
      cfg({ id: 'dup', title: 'Second', path: 'https://example.com/2.epub' }),
      cfg({ id: 'other', path: 'https://example.com/3.pdf', type: 'pdf' }),
    ]);

    expect(books).toHaveLength(2);
    expect(books[0]?.title).toBe('First');
    expect(duplicateIds).toEqual(['dup']);
  });

  it('keeps remote and site-absolute hover URLs; strips invalid ones', () => {
    const { books } = normalizeBookConfigs([
      cfg({
        id: 'remote',
        path: 'https://example.com/a.epub',
        hover: 'https://cdn.example.com/cover.jpg',
      }),
      cfg({
        id: 'site',
        path: 'https://example.com/b.epub',
        hover: '/covers/site.webp',
      }),
      cfg({
        id: 'bad',
        path: 'https://example.com/c.epub',
        hover: '../escape.png',
      }),
      cfg({
        id: 'protocol-relative',
        path: 'https://example.com/d.epub',
        hover: '//evil.example/x.png',
      }),
    ]);
    expect(books.find((b) => b.id === 'remote')?.hover).toBe('https://cdn.example.com/cover.jpg');
    expect(books.find((b) => b.id === 'site')?.hover).toBe('/covers/site.webp');
    expect(books.find((b) => b.id === 'bad')?.hover).toBeUndefined();
    expect(books.find((b) => b.id === 'protocol-relative')?.hover).toBeUndefined();
  });
});
