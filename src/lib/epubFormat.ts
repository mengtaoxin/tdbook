import { XMLParser } from 'fast-xml-parser'
import {
  ensureBookCached,
  getCachedBlobUrl,
  isBookCached,
  readCachedText,
} from './bookCache'
import type { BookPage, EpubBookRecord } from './bookTypes'
import type { BookConfig } from './catalog'
import type { FormatAdapter, PageContent } from './formatAdapter'
import { normalizeEpubPath } from './paths'
import { rewritePageHtml } from './rewriteHtml'

type ManifestItem = {
  id: string
  href: string
  mediaType: string
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  isArray: (name) =>
    ['item', 'itemref', 'meta', 'reference', 'rootfile'].includes(name),
})

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function textOf(node: unknown): string {
  if (node == null) return ''
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (typeof node === 'object' && '#text' in node) {
    return String((node as { '#text': unknown })['#text'] ?? '')
  }
  return ''
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function attr(node: Record<string, unknown> | undefined, name: string) {
  if (!node) return ''
  return String(node[`@_${name}`] ?? '')
}

function packagePath(opfDir: string, href: string) {
  const cleaned = href.replace(/^\/+/, '')
  if (!opfDir) return normalizeEpubPath(cleaned)
  return normalizeEpubPath(`${opfDir}/${cleaned}`)
}

async function resolveOpfPath(
  sourceUrl: string,
): Promise<{ opfPath: string; opfDir: string } | null> {
  const containerXml = await readCachedText(sourceUrl, 'META-INF/container.xml')
  if (containerXml) {
    const parsed = xmlParser.parse(containerXml) as {
      container?: {
        rootfiles?: { rootfile?: Record<string, unknown>[] }
      }
    }
    const rootfile = asArray(parsed.container?.rootfiles?.rootfile)[0]
    const fullPath = attr(rootfile, 'full-path')
    if (fullPath) {
      const opfPath = normalizeEpubPath(fullPath)
      const slash = opfPath.lastIndexOf('/')
      const opfDir = slash === -1 ? '' : opfPath.slice(0, slash)
      return { opfPath, opfDir }
    }
  }

  // Fallback for packages that place content.opf at the root.
  const fallback = await readCachedText(sourceUrl, 'content.opf')
  if (fallback != null) {
    return { opfPath: 'content.opf', opfDir: '' }
  }
  return null
}

async function openEpub(
  id: string,
  config: BookConfig,
): Promise<EpubBookRecord | null> {
  const opfInfo = await resolveOpfPath(config.path)
  if (!opfInfo) return null

  const opfXml = await readCachedText(config.path, opfInfo.opfPath)
  if (opfXml == null) return null

  const parsed = xmlParser.parse(opfXml) as {
    package?: {
      metadata?: Record<string, unknown>
      manifest?: { item?: Record<string, unknown>[] }
      spine?: { itemref?: Record<string, unknown>[] }
    }
  }

  const metadata = parsed.package?.metadata ?? {}
  const items = asArray(parsed.package?.manifest?.item).map((item) => ({
    id: attr(item, 'id'),
    href: attr(item, 'href'),
    mediaType: attr(item, 'media-type'),
  })) satisfies ManifestItem[]

  const itemsById = new Map(items.map((item) => [item.id, item]))
  const spineRefs = asArray(parsed.package?.spine?.itemref)

  const pages: BookPage[] = []
  for (const ref of spineRefs) {
    const item = itemsById.get(attr(ref, 'idref'))
    if (!item) continue
    if (
      item.mediaType === 'application/xhtml+xml' ||
      item.mediaType === 'text/html'
    ) {
      pages.push({
        ...item,
        href: packagePath(opfInfo.opfDir, item.href),
      })
    }
  }

  const title = textOf(metadata.title) || config.title
  const author = textOf(metadata.creator)
  const description = stripHtml(textOf(metadata.description))

  const coverId = asArray(
    metadata.meta as Record<string, unknown>[] | undefined,
  ).find((meta) => attr(meta, 'name') === 'cover')?.['@_content']
  const coverItem =
    typeof coverId === 'string' ? itemsById.get(coverId) : undefined
  const coverHref = coverItem
    ? packagePath(opfInfo.opfDir, coverItem.href)
    : null
  const extractedCover = coverHref
    ? await getCachedBlobUrl(config.path, coverHref)
    : null

  const stylesheetHrefs = items
    .filter((item) => item.mediaType === 'text/css')
    .map((item) => packagePath(opfInfo.opfDir, item.href))

  return {
    id,
    type: 'epub',
    title,
    author,
    description,
    sourceUrl: config.path,
    opfDir: opfInfo.opfDir,
    coverHref,
    coverUrl: extractedCover,
    pages,
    stylesheetHrefs,
  }
}

async function readPageSource(book: EpubBookRecord, pageIndex: number) {
  const page = book.pages[pageIndex]
  if (!page) return null
  return readCachedText(book.sourceUrl, page.href)
}

export const epubAdapter: FormatAdapter = {
  type: 'epub',

  ensure(sourceUrl, catalogId, onProgress) {
    return ensureBookCached(sourceUrl, 'epub', onProgress, catalogId)
  },

  open(id, config) {
    return openEpub(id, config)
  },

  async extractCover(config) {
    if (!(await isBookCached(config.path))) return null
    const book = await openEpub(config.id, config)
    return book?.coverUrl ?? null
  },

  async getPage(book, pageIndex): Promise<PageContent | null> {
    if (book.type !== 'epub') return null
    const source = await readPageSource(book, pageIndex)
    if (source == null) return null
    const current = book.pages[pageIndex]
    if (!current) return null
    const rewritten = await rewritePageHtml(
      source,
      book,
      current.href,
      book.pages,
    )
    return { type: 'epub', rewritten }
  },
}

export type { ManifestItem }
