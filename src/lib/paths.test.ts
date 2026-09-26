import { describe, expect, it } from 'vitest';
import {
  isCatalogResourcePath,
  isRemotePath,
  isSafeSegment,
  isSiteAbsolutePath,
  normalizeEpubPath,
  resolveEpubAssetPath,
} from '@/lib/paths';

describe('paths', () => {
  it('detects remote http(s) paths', () => {
    expect(isRemotePath('https://example.com/a.epub')).toBe(true);
    expect(isRemotePath('http://127.0.0.1/x.pdf')).toBe(true);
    expect(isRemotePath('/local/file.epub')).toBe(false);
  });

  it('detects safe site-absolute paths', () => {
    expect(isSiteAbsolutePath('/books/a.epub')).toBe(true);
    expect(isSiteAbsolutePath('//evil.example/x')).toBe(false);
    expect(isSiteAbsolutePath('/../etc/passwd')).toBe(false);
    expect(isSiteAbsolutePath('relative.epub')).toBe(false);
  });

  it('accepts catalog resource paths (remote or site-absolute)', () => {
    expect(isCatalogResourcePath('https://example.com/a.epub')).toBe(true);
    expect(isCatalogResourcePath('/testdata/sample.epub')).toBe(true);
    expect(isCatalogResourcePath('relative.epub')).toBe(false);
  });

  it('validates catalog id segments', () => {
    expect(isSafeSegment('sample-epub')).toBe(true);
    expect(isSafeSegment('')).toBe(false);
    expect(isSafeSegment('../x')).toBe(false);
    expect(isSafeSegment('a/b')).toBe(false);
  });

  it('normalizes EPUB package paths', () => {
    expect(normalizeEpubPath('OEBPS/../OEBPS/ch.xhtml')).toBe('OEBPS/ch.xhtml');
    expect(normalizeEpubPath('./a/./b')).toBe('a/b');
  });

  it('resolves assets relative to a page href', () => {
    expect(resolveEpubAssetPath('OEBPS/text/ch1.xhtml', '../images/a.png')).toBe(
      'OEBPS/images/a.png',
    );
  });
});
