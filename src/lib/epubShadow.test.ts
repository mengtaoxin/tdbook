import { describe, expect, it } from 'vitest';
import { renderEpubContent, scopeEpubCss } from '@/lib/epubShadow';
import type { RewrittenPage } from '@/lib/rewriteHtml';

function page(overrides: Partial<RewrittenPage> = {}): RewrittenPage {
  return {
    html: '<p>Hello</p>',
    bodyClass: '',
    lang: 'en',
    stylesheetUrls: [],
    inlineStyles: [],
    ...overrides,
  };
}

describe('renderEpubContent', () => {
  it('pins book lang on host and body, independent of document lang', async () => {
    document.documentElement.lang = 'zh-CN';
    const host = document.createElement('div');
    document.body.appendChild(host);

    await renderEpubContent(host, page({ lang: 'en' }));

    const body = host.querySelector('body');
    expect(host.lang).toBe('en');
    expect(body?.lang).toBe('en');
    expect(document.documentElement.lang).toBe('zh-CN');

    document.documentElement.lang = 'en';
    host.remove();
  });

  it('injects base CSS that resets theme font inheritance', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    await renderEpubContent(host, page());

    const css = host.querySelector('style')?.textContent ?? '';
    expect(css).toContain('font-family: Georgia');
    expect(css).toContain('.epub-content');

    host.remove();
  });

  it('puts chapter text in the document so native selection can read it', async () => {
    document.documentElement.lang = 'zh-CN';
    const host = document.createElement('div');
    host.className = 'epub-content';
    document.body.appendChild(host);

    await renderEpubContent(host, page({ html: '<p>Hello from the book</p>', lang: 'en' }));

    const paragraph = host.querySelector('p');
    const textNode = paragraph?.firstChild;
    expect(textNode).toBeInstanceOf(Text);
    expect(document.body.contains(textNode as Node)).toBe(true);
    expect(host.shadowRoot).toBeNull();

    const range = document.createRange();
    range.selectNodeContents(textNode as Text);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(selection?.toString()).toBe('Hello from the book');
    expect(getComputedStyle(paragraph!).userSelect).toBe('text');
    expect(document.documentElement.lang).toBe('zh-CN');

    host.remove();
    document.documentElement.lang = 'en';
  });

  it('keeps reader text selectable when book CSS disables selection', async () => {
    const host = document.createElement('div');
    host.className = 'epub-content';
    document.body.appendChild(host);

    await renderEpubContent(
      host,
      page({
        html: '<p>Selectable</p>',
        inlineStyles: ['p { user-select: none; }'],
      }),
    );

    const paragraph = host.querySelector('p');
    expect(paragraph).toBeTruthy();
    expect(getComputedStyle(paragraph!).userSelect).toBe('text');

    host.remove();
  });
});

describe('scopeEpubCss', () => {
  it('scopes book rules and hoists font faces above @scope', () => {
    const css = scopeEpubCss(
      '@font-face { font-family: Book; src: url(book.woff); } body { color: red } p { content: ";"; }',
    );
    expect(css).toContain('@scope (.epub-content)');
    expect(css.indexOf('@font-face')).toBeLessThan(css.indexOf('@scope'));
    expect(css).toContain('body { color: red }');
    expect(css).toContain('content: ";"');
  });
});
