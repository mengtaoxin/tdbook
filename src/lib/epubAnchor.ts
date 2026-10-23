/** Content-stable in-page anchors for EPUB (survive viewport resize). */

const CHAR_LOCATION_RE = /^#char:(\d+)$/;

export function formatCharLocation(offset: number): string {
  const safe = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  return `#char:${safe}`;
}

/** Normalize router/location quirks such as a doubled leading `#`. */
export function normalizeAnchorLocation(location: string): string {
  if (!location) return '';
  let value = location;
  while (value.startsWith('##')) value = value.slice(1);
  if (value && !value.startsWith('#')) value = `#${value}`;
  return value;
}

export function parseCharLocation(location: string): number | null {
  const match = CHAR_LOCATION_RE.exec(normalizeAnchorLocation(location));
  if (!match) return null;
  return Number(match[1]);
}

export function textPositionAtCharOffset(
  root: Element,
  offset: number,
): { node: Text; offset: number } | null {
  if (!Number.isInteger(offset) || offset < 0) return null;

  let remaining = offset;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const length = textNode.data.length;
    if (remaining <= length) {
      // Prefer the next node when the offset lands exactly on a boundary.
      if (remaining === length) {
        const next = walker.nextNode();
        if (next) {
          return { node: next as Text, offset: 0 };
        }
        return { node: textNode, offset: length };
      }
      return { node: textNode, offset: remaining };
    }
    remaining -= length;
    node = walker.nextNode();
  }
  return null;
}

/**
 * Top of the readable viewport.
 * A sticky app bar is the stable line: the book host moves when the page scrolls,
 * so its top cannot be the scroll target.
 */
export function visibleReadingTop(host: Element): number {
  const appBar = document.querySelector('.MuiAppBar-root');
  if (appBar) return appBar.getBoundingClientRect().bottom;
  return Math.max(0, host.getBoundingClientRect().top);
}

function probeNodeRect(textNode: Text): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(textNode);
  return range.getBoundingClientRect();
}

function charTopInNode(textNode: Text, index: number): number {
  const length = textNode.data.length;
  if (length === 0) return probeNodeRect(textNode).top;
  const clamped = Math.min(Math.max(index, 0), length - 1);
  const range = document.createRange();
  range.setStart(textNode, clamped);
  range.setEnd(textNode, clamped + 1);
  return range.getBoundingClientRect().top;
}

/** First char index in the text node whose box top is at or below viewportTop. */
function firstCharAtOrBelow(textNode: Text, viewportTop: number): number {
  const length = textNode.data.length;
  if (length === 0) return 0;
  let lo = 0;
  let hi = length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (charTopInNode(textNode, mid) < viewportTop) lo = mid + 1;
    else hi = mid;
  }
  return Math.min(lo, length - 1);
}

export function captureEpubAnchor(root: HTMLElement, options?: { viewportTop?: number }): string {
  const body = root.querySelector('body');
  if (!body) return formatCharLocation(0);

  const viewportTop = options?.viewportTop ?? visibleReadingTop(root);
  let offset = 0;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const length = textNode.data.length;
    if (length === 0) {
      node = walker.nextNode();
      continue;
    }

    const rect = probeNodeRect(textNode);
    if (rect.bottom <= viewportTop) {
      offset += length;
      node = walker.nextNode();
      continue;
    }

    if (rect.top >= viewportTop) {
      return formatCharLocation(offset);
    }

    const index = firstCharAtOrBelow(textNode, viewportTop);
    return formatCharLocation(offset + index);
  }

  return formatCharLocation(Math.max(0, offset));
}

function scrollToCharOffset(root: HTMLElement, offset: number) {
  const body = root.querySelector('body');
  if (!body) return;
  const position = textPositionAtCharOffset(body, offset);
  if (!position) return;

  const { node, offset: nodeOffset } = position;
  const parent = node.parentElement;
  if (!parent) return;

  const range = document.createRange();
  if (node.data.length === 0) {
    parent.scrollIntoView();
    return;
  }
  const start = Math.min(nodeOffset, Math.max(0, node.data.length - 1));
  range.setStart(node, start);
  range.setEnd(node, Math.min(start + 1, node.data.length));
  const rect = range.getBoundingClientRect();
  if (rect.height > 0 || rect.width > 0) {
    const targetTop = visibleReadingTop(root);
    window.scrollBy(0, rect.top - targetTop);
    return;
  }

  parent.scrollIntoView();
}

export function scrollEpubAnchor(root: HTMLElement, location: string): void {
  const normalized = normalizeAnchorLocation(location);
  if (!normalized) return;

  const charOffset = parseCharLocation(normalized);
  if (charOffset !== null) {
    scrollToCharOffset(root, charOffset);
    return;
  }

  const id = normalized.startsWith('#') ? normalized.slice(1) : normalized;
  if (!id) return;
  root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.scrollIntoView();
}

export function captureReaderLocation(): string {
  const host = document.querySelector<HTMLElement>('[data-testid="epub-content"]');
  if (!host) return '';
  return captureEpubAnchor(host);
}

/** Hash value for TanStack navigate (no leading `#`). */
export function locationToRouterHash(location: string): string {
  const normalized = normalizeAnchorLocation(location);
  return normalized.startsWith('#') ? normalized.slice(1) : normalized;
}
