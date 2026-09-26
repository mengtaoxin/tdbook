import { XMLParser } from 'fast-xml-parser';
import type { BookPage } from './bookTypes';
import { readCachedText } from './cacheStore';
import { normalizeEpubPath } from './paths';

export type ManifestItem = {
  id: string;
  href: string;
  mediaType: string;
};

export type ParsedEpubPackage = {
  opfDir: string;
  title: string;
  author: string;
  description: string;
  pages: BookPage[];
  coverHref: string | null;
  stylesheetHrefs: string[];
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  isArray: (name) => ['item', 'itemref', 'meta', 'reference', 'rootfile'].includes(name),
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (typeof node === 'object' && '#text' in node) {
    return String((node as { '#text': unknown })['#text'] ?? '');
  }
  return '';
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function attr(node: Record<string, unknown> | undefined, name: string) {
  if (!node) return '';
  return String(node[`@_${name}`] ?? '');
}

function packagePath(opfDir: string, href: string) {
  const cleaned = href.replace(/^\/+/, '');
  if (!opfDir) return normalizeEpubPath(cleaned);
  return normalizeEpubPath(`${opfDir}/${cleaned}`);
}

async function resolveOpfPath(
  sourceUrl: string,
): Promise<{ opfPath: string; opfDir: string } | null> {
  const containerXml = await readCachedText(sourceUrl, 'META-INF/container.xml');
  if (containerXml) {
    const parsed = xmlParser.parse(containerXml) as {
      container?: {
        rootfiles?: { rootfile?: Record<string, unknown>[] };
      };
    };
    const rootfile = asArray(parsed.container?.rootfiles?.rootfile)[0];
    const fullPath = attr(rootfile, 'full-path');
    if (fullPath) {
      const opfPath = normalizeEpubPath(fullPath);
      const slash = opfPath.lastIndexOf('/');
      const opfDir = slash === -1 ? '' : opfPath.slice(0, slash);
      return { opfPath, opfDir };
    }
  }

  // Fallback for packages that place content.opf at the root.
  const fallback = await readCachedText(sourceUrl, 'content.opf');
  if (fallback != null) {
    return { opfPath: 'content.opf', opfDir: '' };
  }
  return null;
}

/** Parse a cached EPUB's OPF into spine, styles, and cover href (no blob URLs). */
export async function parseCachedEpubPackage(
  sourceUrl: string,
  fallbackTitle: string,
): Promise<ParsedEpubPackage | null> {
  const opfInfo = await resolveOpfPath(sourceUrl);
  if (!opfInfo) return null;

  const opfXml = await readCachedText(sourceUrl, opfInfo.opfPath);
  if (opfXml == null) return null;

  const parsed = xmlParser.parse(opfXml) as {
    package?: {
      metadata?: Record<string, unknown>;
      manifest?: { item?: Record<string, unknown>[] };
      spine?: { itemref?: Record<string, unknown>[] };
    };
  };

  const metadata = parsed.package?.metadata ?? {};
  const items = asArray(parsed.package?.manifest?.item).map((item) => ({
    id: attr(item, 'id'),
    href: attr(item, 'href'),
    mediaType: attr(item, 'media-type'),
  })) satisfies ManifestItem[];

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const spineRefs = asArray(parsed.package?.spine?.itemref);

  const pages: BookPage[] = [];
  for (const ref of spineRefs) {
    const item = itemsById.get(attr(ref, 'idref'));
    if (!item) continue;
    if (item.mediaType === 'application/xhtml+xml' || item.mediaType === 'text/html') {
      pages.push({
        ...item,
        href: packagePath(opfInfo.opfDir, item.href),
      });
    }
  }

  const coverId = asArray(metadata.meta as Record<string, unknown>[] | undefined).find(
    (meta) => attr(meta, 'name') === 'cover',
  )?.['@_content'];
  const coverItem = typeof coverId === 'string' ? itemsById.get(coverId) : undefined;

  return {
    opfDir: opfInfo.opfDir,
    title: textOf(metadata.title) || fallbackTitle,
    author: textOf(metadata.creator),
    description: stripHtml(textOf(metadata.description)),
    pages,
    coverHref: coverItem ? packagePath(opfInfo.opfDir, coverItem.href) : null,
    stylesheetHrefs: items
      .filter((item) => item.mediaType === 'text/css')
      .map((item) => packagePath(opfInfo.opfDir, item.href)),
  };
}
