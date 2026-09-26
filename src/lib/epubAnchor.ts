/** Content-stable in-page anchors for EPUB (survive viewport resize). */

const CHAR_LOCATION_RE = /^#char:(\d+)$/;

export function formatCharLocation(offset: number): string {
  const safe = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  return `#char:${safe}`;
}

export function parseCharLocation(location: string): number | null {
  const match = CHAR_LOCATION_RE.exec(location);
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
      // At exact end of this node when remaining === length and more nodes follow:
      // keep walking so offset points at the next node start when possible.
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

function viewportTopForHost(host: Element): number {
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

export function captureEpubAnchor(shadow: ShadowRoot): string {
  const body = shadow.querySelector('body');
  const host = shadow.host;
  if (!body || !host) return formatCharLocation(0);

  const viewportTop = viewportTopForHost(host);
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

function scrollToCharOffset(shadow: ShadowRoot, offset: number) {
  const body = shadow.querySelector('body');
  if (!body) return;
  const position = textPositionAtCharOffset(body, offset);
  if (!position) return;

  const { node, offset: nodeOffset } = position;
  const parent = node.parentElement;
  if (!parent) return;

  if (nodeOffset <= 0 || node.data.length === 0) {
    parent.scrollIntoView();
    return;
  }

  // Prefer scrolling a collapsed range's client rect into the viewport top.
  const range = document.createRange();
  const end = Math.min(nodeOffset + 1, node.data.length);
  range.setStart(node, Math.min(nodeOffset, node.data.length));
  range.setEnd(node, end);
  const rect = range.getBoundingClientRect();
  if (rect.height > 0 || rect.width > 0) {
    const hostTop = Math.max(0, shadow.host.getBoundingClientRect().top);
    window.scrollBy(0, rect.top - hostTop - 1);
    return;
  }

  parent.scrollIntoView();
}

export function scrollEpubAnchor(shadow: ShadowRoot, location: string): void {
  if (!location) return;

  const charOffset = parseCharLocation(location);
  if (charOffset !== null) {
    scrollToCharOffset(shadow, charOffset);
    return;
  }

  const id = location.startsWith('#') ? location.slice(1) : location;
  if (!id) return;
  shadow.getElementById(id)?.scrollIntoView();
}

export function captureReaderLocation(): string {
  const host = document.querySelector<HTMLElement>('[data-testid="epub-content"]');
  const shadow = host?.shadowRoot;
  if (!shadow) return '';
  return captureEpubAnchor(shadow);
}
