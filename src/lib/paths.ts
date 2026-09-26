export function isRemotePath(path: string) {
  return /^https?:\/\//i.test(path.trim());
}

/** Same-origin absolute path (`/foo.epub`); rejects `//…`, `..`, and relative paths. */
export function isSiteAbsolutePath(path: string) {
  const trimmed = path.trim();
  return (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('..') &&
    !trimmed.includes('\\') &&
    !trimmed.includes('\0')
  );
}

/** Catalog `path` / `hover`: remote `http(s)://…` or site-absolute `/…`. */
export function isCatalogResourcePath(path: string) {
  const trimmed = path.trim();
  return isRemotePath(trimmed) || isSiteAbsolutePath(trimmed);
}

export function isSafeSegment(value: string) {
  return (
    value.length > 0 &&
    !value.includes('\0') &&
    !value.includes('..') &&
    !value.includes('/') &&
    !value.includes('\\')
  );
}

/** Resolve a path relative to an EPUB page href into a normalized package path. */
export function resolveEpubAssetPath(pageHref: string, relativeHref: string) {
  const directory = pageHref.includes('/') ? pageHref.slice(0, pageHref.lastIndexOf('/')) : '';
  const joined = directory ? `${directory}/${relativeHref}` : relativeHref;
  return normalizeEpubPath(joined);
}

export function normalizeEpubPath(href: string) {
  const decoded = decodeURI(href);
  const parts = decoded.replace(/\\/g, '/').split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join('/');
}
