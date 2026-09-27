import { getCachedBlobUrl } from './cacheStore';
import type { BookPage, EpubBookRecord } from './bookTypes';
import { normalizeEpubPath, resolveEpubAssetPath } from './paths';

export type RewrittenPage = {
  html: string;
  bodyClass: string;
  /** BCP 47 language from the EPUB page (not the app UI locale). */
  lang: string;
  /** Resolved blob: URLs for stylesheets */
  stylesheetUrls: string[];
  inlineStyles: string[];
};

const EXTERNAL_HREF = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const XML_NS = 'http://www.w3.org/XML/1998/namespace';

function elementLang(el: Element | null | undefined): string {
  if (!el) return '';
  return (
    el.getAttributeNS(XML_NS, 'lang')?.trim() ||
    el.getAttribute('xml:lang')?.trim() ||
    el.getAttribute('lang')?.trim() ||
    ''
  );
}

/** Prefer body, then root; default en so UI locale never leaks in. */
export function documentLang(doc: Document): string {
  const body = doc.body ?? doc.querySelector('body');
  return elementLang(body) || elementLang(doc.documentElement) || 'en';
}

function splitHash(href: string) {
  const hashIndex = href.indexOf('#');
  if (hashIndex === -1) return { pathname: href, hash: '' };
  if (hashIndex === 0) return { pathname: '', hash: href };
  return {
    pathname: href.slice(0, hashIndex),
    hash: href.slice(hashIndex),
  };
}

export function normalizeEpubHref(href: string) {
  return normalizeEpubPath(href);
}

function pageUrl(bookId: string, pageNumber: number, hash: string) {
  return `/book/${encodeURIComponent(bookId)}?page=${pageNumber}${hash}`;
}

function setAttr(el: Element, name: string, value: string) {
  el.setAttribute(name, value);
}

export async function rewritePageHtml(
  xhtml: string,
  book: EpubBookRecord,
  pageHref: string,
  pages: BookPage[],
): Promise<RewrittenPage> {
  const pagesByHref = new Map(
    pages.map((page, index) => [normalizeEpubHref(page.href), index + 1]),
  );

  const doc = new DOMParser().parseFromString(xhtml, 'application/xhtml+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const htmlDoc = new DOMParser().parseFromString(xhtml, 'text/html');
    return rewriteFromDocument(htmlDoc, book, pageHref, pagesByHref);
  }

  return rewriteFromDocument(doc, book, pageHref, pagesByHref);
}

async function resolveHref(
  value: string,
  book: EpubBookRecord,
  pageHref: string,
  pagesByHref: Map<string, number>,
): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed || EXTERNAL_HREF.test(trimmed)) return trimmed;

  const { pathname, hash } = splitHash(trimmed);
  if (!pathname) return trimmed;

  const resolved = resolveEpubAssetPath(pageHref, pathname);
  const pageNumber = pagesByHref.get(resolved);
  if (pageNumber != null) {
    return pageUrl(book.id, pageNumber, hash);
  }

  const blobUrl = await getCachedBlobUrl(book.sourceUrl, resolved);
  return blobUrl ? `${blobUrl}${hash}` : trimmed;
}

async function rewriteFromDocument(
  doc: Document,
  book: EpubBookRecord,
  pageHref: string,
  pagesByHref: Map<string, number>,
): Promise<RewrittenPage> {
  const stylesheetPaths: string[] = [];
  doc.querySelectorAll("link[rel='stylesheet']").forEach((element) => {
    const href = element.getAttribute('href');
    const type = element.getAttribute('type') ?? '';
    if (!href || EXTERNAL_HREF.test(href)) return;
    if (type && type !== 'text/css' && !type.includes('css')) return;
    stylesheetPaths.push(resolveEpubAssetPath(pageHref, href));
  });

  const inlineStyles: string[] = [];
  doc.querySelectorAll('head style').forEach((element) => {
    const css = element.textContent;
    if (css?.trim()) inlineStyles.push(css);
  });

  const targets: Array<{ element: Element; attribute: string }> = [
    ...Array.from(doc.querySelectorAll('a[href], link[href]'), (element) => ({
      element,
      attribute: 'href',
    })),
    ...Array.from(doc.querySelectorAll('[src]'), (element) => ({ element, attribute: 'src' })),
    ...Array.from(doc.querySelectorAll('image')).flatMap((element) =>
      ['href', 'xlink:href'].map((attribute) => ({ element, attribute })),
    ),
  ];

  const paths = stylesheetPaths.length > 0 ? stylesheetPaths : book.stylesheetHrefs;
  const [, resolvedStylesheetUrls] = await Promise.all([
    Promise.all(
      targets.map(async ({ element, attribute }) => {
        const current = element.getAttribute(attribute);
        if (!current) return;
        setAttr(element, attribute, await resolveHref(current, book, pageHref, pagesByHref));
      }),
    ),
    Promise.all(paths.map((path) => getCachedBlobUrl(book.sourceUrl, normalizeEpubPath(path)))),
  ]);
  const stylesheetUrls = resolvedStylesheetUrls.filter((url): url is string => Boolean(url));

  const body = doc.body ?? doc.querySelector('body');
  return {
    html: body?.innerHTML ?? '',
    bodyClass: body?.getAttribute('class') ?? '',
    lang: documentLang(doc),
    stylesheetUrls,
    inlineStyles,
  };
}
