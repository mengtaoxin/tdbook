import { getCachedBlobUrl } from './bookCache'
import type { BookPage, EpubBookRecord } from './bookTypes'
import { normalizeEpubPath, resolveEpubAssetPath } from './paths'

export type RewrittenPage = {
  html: string
  bodyClass: string
  /** Resolved blob: URLs for stylesheets */
  stylesheetUrls: string[]
  inlineStyles: string[]
}

const EXTERNAL_HREF = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i

function splitHash(href: string) {
  const hashIndex = href.indexOf('#')
  if (hashIndex === -1) return { pathname: href, hash: '' }
  if (hashIndex === 0) return { pathname: '', hash: href }
  return {
    pathname: href.slice(0, hashIndex),
    hash: href.slice(hashIndex),
  }
}

export function normalizeEpubHref(href: string) {
  return normalizeEpubPath(href)
}

function pageUrl(bookId: string, pageNumber: number, hash: string) {
  return `/book/${encodeURIComponent(bookId)}?page=${pageNumber}${hash}`
}

function setAttr(el: Element, name: string, value: string) {
  el.setAttribute(name, value)
}

export async function rewritePageHtml(
  xhtml: string,
  book: EpubBookRecord,
  pageHref: string,
  pages: BookPage[],
): Promise<RewrittenPage> {
  const pagesByHref = new Map(
    pages.map((page, index) => [normalizeEpubHref(page.href), index + 1]),
  )

  const doc = new DOMParser().parseFromString(xhtml, 'application/xhtml+xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    const htmlDoc = new DOMParser().parseFromString(xhtml, 'text/html')
    return rewriteFromDocument(htmlDoc, book, pageHref, pagesByHref)
  }

  return rewriteFromDocument(doc, book, pageHref, pagesByHref)
}

async function resolveHref(
  value: string,
  book: EpubBookRecord,
  pageHref: string,
  pagesByHref: Map<string, number>,
): Promise<string> {
  const trimmed = value.trim()
  if (!trimmed || EXTERNAL_HREF.test(trimmed)) return trimmed

  const { pathname, hash } = splitHash(trimmed)
  if (!pathname) return trimmed

  const resolved = resolveEpubAssetPath(pageHref, pathname)
  const pageNumber = pagesByHref.get(resolved)
  if (pageNumber != null) {
    return pageUrl(book.id, pageNumber, hash)
  }

  const blobUrl = await getCachedBlobUrl(book.sourceUrl, resolved)
  return blobUrl ? `${blobUrl}${hash}` : trimmed
}

async function rewriteFromDocument(
  doc: Document,
  book: EpubBookRecord,
  pageHref: string,
  pagesByHref: Map<string, number>,
): Promise<RewrittenPage> {
  const stylesheetPaths: string[] = []
  doc.querySelectorAll("link[rel='stylesheet']").forEach((element) => {
    const href = element.getAttribute('href')
    const type = element.getAttribute('type') ?? ''
    if (!href || EXTERNAL_HREF.test(href)) return
    if (type && type !== 'text/css' && !type.includes('css')) return
    stylesheetPaths.push(resolveEpubAssetPath(pageHref, href))
  })

  const inlineStyles: string[] = []
  doc.querySelectorAll('head style').forEach((element) => {
    const css = element.textContent
    if (css?.trim()) inlineStyles.push(css)
  })

  for (const element of Array.from(doc.querySelectorAll('a[href], link[href]'))) {
    const current = element.getAttribute('href')
    if (!current) continue
    setAttr(
      element,
      'href',
      await resolveHref(current, book, pageHref, pagesByHref),
    )
  }

  for (const element of Array.from(doc.querySelectorAll('[src]'))) {
    const current = element.getAttribute('src')
    if (!current) continue
    setAttr(
      element,
      'src',
      await resolveHref(current, book, pageHref, pagesByHref),
    )
  }

  for (const element of Array.from(doc.querySelectorAll('image'))) {
    for (const attribute of ['href', 'xlink:href'] as const) {
      const current = element.getAttribute(attribute)
      if (!current) continue
      setAttr(
        element,
        attribute,
        await resolveHref(current, book, pageHref, pagesByHref),
      )
    }
  }

  const stylesheetUrls: string[] = []
  const paths =
    stylesheetPaths.length > 0 ? stylesheetPaths : book.stylesheetHrefs
  for (const path of paths) {
    const url = await getCachedBlobUrl(book.sourceUrl, normalizeEpubPath(path))
    if (url) stylesheetUrls.push(url)
  }

  const body = doc.body ?? doc.querySelector('body')
  return {
    html: body?.innerHTML ?? '',
    bodyClass: body?.getAttribute('class') ?? '',
    stylesheetUrls,
    inlineStyles,
  }
}
