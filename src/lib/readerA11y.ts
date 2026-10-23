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

/**
 * Arrow-key page turns select the landed passage so assistive tech can read
 * `document.getSelection()`. That selection is not a user selection: left and
 * right still turn the page. A pointer selection keeps the old behavior.
 */
const READER_RENDER_ATTR = 'data-reader-render';

export const READER_CONTENT_READY_EVENT = 'readercontentready';

type OwnedSelection = {
  anchorNode: Node;
  anchorOffset: number;
  focusNode: Node;
  focusOffset: number;
};

type PendingArrowSelection = {
  page: number;
  render: string;
  applied: string;
};

let readerRenderSerial = 0;
let pendingArrow: PendingArrowSelection | null = null;
let owned: OwnedSelection | null = null;
let applyingOwned = 0;
let userSelecting = false;
let listenersInstalled = false;

function ensureSelectionListeners(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;
  document.addEventListener('pointerdown', () => {
    userSelecting = true;
  });
  document.addEventListener('pointerup', () => {
    userSelecting = false;
  });
  document.addEventListener('pointercancel', () => {
    userSelecting = false;
  });
  document.addEventListener('selectionchange', () => {
    if (applyingOwned > 0) return;
    if (userSelecting) {
      owned = null;
      pendingArrow = null;
      return;
    }
    const selection = document.getSelection();
    if (!selection || !isOwnedSelection(selection)) owned = null;
  });
}

function snapshotSelection(selection: Selection): OwnedSelection | null {
  const { anchorNode, focusNode } = selection;
  if (!anchorNode || !focusNode || selection.isCollapsed) return null;
  return {
    anchorNode,
    anchorOffset: selection.anchorOffset,
    focusNode,
    focusOffset: selection.focusOffset,
  };
}

function isOwnedSelection(selection: Selection): boolean {
  if (!owned || !selection.anchorNode || !selection.focusNode || selection.isCollapsed) {
    return false;
  }
  return (
    selection.anchorNode === owned.anchorNode &&
    selection.anchorOffset === owned.anchorOffset &&
    selection.focusNode === owned.focusNode &&
    selection.focusOffset === owned.focusOffset
  );
}

export function hasSelectedText(): boolean {
  const selection = document.getSelection();
  if (!selection || isOwnedSelection(selection)) return false;
  return selection.toString().trim().length > 0;
}

/** Bump the content generation on a reader host after its text is in the document. */
export function markReaderContentCommitted(host: HTMLElement): void {
  readerRenderSerial += 1;
  host.setAttribute(READER_RENDER_ATTR, String(readerRenderSerial));
  host.dispatchEvent(new Event(READER_CONTENT_READY_EVENT, { bubbles: true }));
}

/** Drop an arrow selection that belongs to a page the reader has left. */
export function syncArrowPageSelection(page: number): void {
  if (pendingArrow && pendingArrow.page !== page) pendingArrow = null;
}

/** Remember that the next committed page should become the document selection. */
export function armArrowPageSelection(page: number): void {
  ensureSelectionListeners();
  const marked = document.querySelector(`[${READER_RENDER_ATTR}]`);
  pendingArrow = {
    page,
    render: marked?.getAttribute(READER_RENDER_ATTR) ?? '',
    applied: '',
  };
}

function renderToken(root: Element): string {
  return root.closest(`[${READER_RENDER_ATTR}]`)?.getAttribute(READER_RENDER_ATTR) ?? '';
}

function selectRange(range: Range): void {
  const selection = document.getSelection();
  if (!selection) return;
  ensureSelectionListeners();
  applyingOwned += 1;
  try {
    selection.removeAllRanges();
    selection.addRange(range);
    owned = snapshotSelection(selection);
  } finally {
    applyingOwned -= 1;
  }
}

function lineSpans(root: Element, viewportTop: number): HTMLElement[] {
  const spans: HTMLElement[] = [];
  let lineTop: number | null = null;
  for (const node of root.querySelectorAll('span')) {
    if (!(node instanceof HTMLElement)) continue;
    if (!node.textContent) continue;
    const box = node.getBoundingClientRect();
    if (!hasBox(box) || box.bottom <= viewportTop) continue;
    if (lineTop == null) lineTop = box.top;
    if (box.top > lineTop + LINE_SLOP_PX) break;
    spans.push(node);
  }
  return spans;
}

function passageRange(root: Element, viewportTop: number): Range | null {
  const block = blockAtReadingPosition(root, viewportTop);
  if (block && (block.textContent ?? '').trim()) {
    const range = document.createRange();
    range.selectNodeContents(block);
    return range;
  }

  const spans = lineSpans(root, viewportTop);
  const start = spans[0];
  const end = spans[spans.length - 1];
  if (!start || !end) return null;
  if (!spans.some((span) => (span.textContent ?? '').trim())) return null;
  const range = document.createRange();
  range.setStart(start, 0);
  range.setEnd(end, end.childNodes.length);
  return range;
}

/** Select the passage once a content commit moves past the armed page. */
export function applyArrowPageSelection(page: number, root: Element, viewportTop: number): void {
  if (!pendingArrow || pendingArrow.page !== page) return;
  const live = document.getSelection();
  if (live && live.toString().trim() && !isOwnedSelection(live)) return;

  const token = renderToken(root);
  if (!token || token === pendingArrow.render || token === pendingArrow.applied) return;

  const range = passageRange(root, viewportTop);
  if (!range || !range.toString().trim()) return;
  selectRange(range);
  if (owned) pendingArrow.applied = token;
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
