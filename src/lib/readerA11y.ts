/** Where an arrow key should turn the reader page, if it should. */
export type PageArrowInput = {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  defaultPrevented: boolean;
  target: EventTarget | null;
  hasSelection: boolean;
};

export type SelectionProbe = {
  isCollapsed: boolean;
  anchorNode: Node | null;
};

const BLOCK_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, pre, dd, dt, td, th';

const LINE_SLOP_PX = 8;

function capText(value: string, maxLength: number): string {
  const collapsed = value.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxLength) return collapsed;
  if (maxLength <= 1) return '…';
  return `${collapsed.slice(0, maxLength - 1).trimEnd()}…`;
}

function hasBox(box: DOMRect): boolean {
  return box.width > 0 || box.height > 0;
}

function guardedKeyTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(target.closest('[role="dialog"], [role="menu"], [role="listbox"], dialog'));
}

export function pageArrowDirection(input: PageArrowInput): 'prev' | 'next' | null {
  if (input.defaultPrevented || input.altKey || input.ctrlKey || input.metaKey || input.shiftKey) {
    return null;
  }
  if (input.hasSelection || guardedKeyTarget(input.target)) return null;
  if (input.key === 'ArrowLeft') return 'prev';
  if (input.key === 'ArrowRight') return 'next';
  return null;
}

export function hasSelectedText(): boolean {
  const text = document.getSelection()?.toString() ?? '';
  return text.trim().length > 0;
}

/** First semantic block that still extends below the reading line. */
export function blockAtReadingPosition(root: Element, viewportTop: number): Element | null {
  const blocks = root.querySelectorAll(BLOCK_SELECTOR);
  let last: Element | null = null;
  for (const block of blocks) {
    const box = block.getBoundingClientRect();
    if (!hasBox(box)) continue;
    last = block;
    if (box.bottom > viewportTop + 1) return block;
  }
  return last;
}

/** Marks the in-view block with `aria-current="location"` and clears the previous mark. */
export function markCurrentReadingBlock(root: Element, viewportTop: number): Element | null {
  const next = blockAtReadingPosition(root, viewportTop);
  const previous = root.querySelector('[aria-current="location"]');
  if (previous && previous !== next) previous.removeAttribute('aria-current');
  if (next) next.setAttribute('aria-current', 'location');
  return next;
}

function lineText(root: Element, viewportTop: number): string {
  const bits: string[] = [];
  let lineTop: number | null = null;
  for (const node of root.querySelectorAll('span')) {
    const text = node.textContent ?? '';
    if (!text) continue;
    const box = node.getBoundingClientRect();
    if (!hasBox(box) || box.bottom <= viewportTop) continue;
    if (lineTop == null) lineTop = box.top;
    if (box.top > lineTop + LINE_SLOP_PX) break;
    bits.push(text);
  }
  return bits.join('');
}

/** Passage at the reading line: a semantic block, or one PDF text-layer line. */
export function excerptAtReadingPosition(
  root: Element,
  viewportTop: number,
  maxLength = 180,
): string {
  const block = blockAtReadingPosition(root, viewportTop);
  if (block) return capText(block.textContent ?? '', maxLength);
  return capText(lineText(root, viewportTop), maxLength);
}

export function selectionInside(
  selection: SelectionProbe | null,
  boundary: Element | null,
): boolean {
  if (!selection || selection.isCollapsed || !boundary) return false;
  const node = selection.anchorNode;
  if (!node) return false;
  if (boundary.contains(node)) return true;
  const root = node.getRootNode();
  return root instanceof ShadowRoot && boundary.contains(root.host);
}

export function normalizeSelectedText(value: string, maxLength = 280): string {
  return capText(value, maxLength);
}
