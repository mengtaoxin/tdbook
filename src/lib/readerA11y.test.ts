import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '@/i18n/locales/en';
import zh from '@/i18n/locales/zh';
import {
  applyArrowPageSelection,
  armArrowPageSelection,
  blockAtReadingPosition,
  excerptAtReadingPosition,
  hasSelectedText,
  markCurrentReadingBlock,
  markReaderContentCommitted,
  normalizeSelectedText,
  pageArrowDirection,
  selectionInside,
  syncArrowPageSelection,
  type PageArrowInput,
} from '@/lib/readerA11y';

function rect(top: number, height: number): DOMRect {
  return {
    x: 0,
    y: top,
    width: 120,
    height,
    top,
    right: 120,
    bottom: top + height,
    left: 0,
    toJSON() {
      return {};
    },
  };
}

function arrow(overrides: Partial<PageArrowInput> = {}): PageArrowInput {
  return {
    key: 'ArrowRight',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    defaultPrevented: false,
    target: document.body,
    hasSelection: false,
    ...overrides,
  };
}

describe('pageArrowDirection', () => {
  it('turns the page on unmodified left and right arrows', () => {
    expect(pageArrowDirection(arrow({ key: 'ArrowLeft' }))).toBe('prev');
    expect(pageArrowDirection(arrow({ key: 'ArrowRight' }))).toBe('next');
    expect(pageArrowDirection(arrow({ key: 'ArrowDown' }))).toBeNull();
  });

  it('leaves arrows alone while editing, in a menu, or extending a selection', () => {
    const input = document.createElement('input');
    const menuItem = document.createElement('div');
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    menu.append(menuItem);
    const editable = document.createElement('div');
    editable.contentEditable = 'true';

    expect(pageArrowDirection(arrow({ target: input }))).toBeNull();
    expect(pageArrowDirection(arrow({ target: menuItem }))).toBeNull();
    expect(pageArrowDirection(arrow({ target: editable }))).toBeNull();
    expect(pageArrowDirection(arrow({ shiftKey: true }))).toBeNull();
    expect(pageArrowDirection(arrow({ altKey: true }))).toBeNull();
    expect(pageArrowDirection(arrow({ ctrlKey: true }))).toBeNull();
    expect(pageArrowDirection(arrow({ metaKey: true }))).toBeNull();
    expect(pageArrowDirection(arrow({ defaultPrevented: true }))).toBeNull();
    expect(pageArrowDirection(arrow({ hasSelection: true }))).toBeNull();
  });
});

describe('arrow page selection', () => {
  afterEach(() => {
    document.getSelection()?.removeAllRanges();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('selects the full new passage after the page content commits, without blocking another arrow', () => {
    const article = document.createElement('article');
    const hint = document.createElement('p');
    hint.textContent = '当前段落：Chapter Two';
    const host = document.createElement('div');
    const body = document.createElement('body');
    const heading = document.createElement('h1');
    const paragraph = document.createElement('p');
    const full = `${'Long passage '.repeat(40)}end`;
    heading.textContent = 'Chapter Two';
    paragraph.append('Hello ');
    const strong = document.createElement('strong');
    strong.textContent = 'world';
    paragraph.append(strong, ` ${full}`);
    body.append(heading, paragraph);
    host.append(body);
    article.append(hint, host);
    document.body.append(article);

    vi.spyOn(heading, 'getBoundingClientRect').mockReturnValue(rect(0, 10));
    vi.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue(rect(10, 80));

    markReaderContentCommitted(host);
    armArrowPageSelection(2);
    applyArrowPageSelection(2, body, 0);
    expect(document.getSelection()?.toString() ?? '').toBe('');

    markReaderContentCommitted(host);
    applyArrowPageSelection(2, body, 20);

    const selected = document.getSelection()?.toString() ?? '';
    expect(selected).toBe(`Hello world ${full}`);
    expect(selected).not.toContain('当前段落');
    expect(selected.endsWith('…')).toBe(false);
    expect(hasSelectedText()).toBe(false);
    expect(pageArrowDirection(arrow({ hasSelection: hasSelectedText() }))).toBe('next');
    expect(pageArrowDirection(arrow({ key: 'ArrowLeft', hasSelection: hasSelectedText() }))).toBe(
      'prev',
    );
  });

  it('keeps a mouse selection blocking page arrows', () => {
    const host = document.createElement('div');
    const body = document.createElement('body');
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Hello from the book';
    body.append(paragraph);
    host.append(body);
    document.body.append(host);
    vi.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue(rect(0, 40));

    markReaderContentCommitted(host);
    armArrowPageSelection(2);
    markReaderContentCommitted(host);
    applyArrowPageSelection(2, body, 0);
    expect(document.getSelection()?.toString()).toBe('Hello from the book');
    expect(hasSelectedText()).toBe(false);

    const text = paragraph.firstChild;
    if (!text) throw new Error('missing text');
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 5);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(hasSelectedText()).toBe(true);
    expect(pageArrowDirection(arrow({ hasSelection: hasSelectedText() }))).toBeNull();
  });

  it('releases an identical passage selection when the pointer changes it', () => {
    const host = document.createElement('div');
    const body = document.createElement('body');
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Hello from the book';
    body.append(paragraph);
    host.append(body);
    document.body.append(host);
    vi.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue(rect(0, 40));

    markReaderContentCommitted(host);
    armArrowPageSelection(2);
    markReaderContentCommitted(host);
    applyArrowPageSelection(2, body, 0);
    expect(hasSelectedText()).toBe(false);

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    document.dispatchEvent(new Event('selectionchange'));
    expect(document.getSelection()?.toString()).toBe('Hello from the book');
    expect(hasSelectedText()).toBe(true);
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  });

  it('drops an armed selection when the reader leaves that page', () => {
    const host = document.createElement('div');
    const body = document.createElement('body');
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Stay unselected';
    body.append(paragraph);
    host.append(body);
    document.body.append(host);
    vi.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue(rect(0, 40));

    markReaderContentCommitted(host);
    armArrowPageSelection(2);
    syncArrowPageSelection(1);
    markReaderContentCommitted(host);
    applyArrowPageSelection(2, body, 0);

    expect(document.getSelection()?.toString() ?? '').toBe('');
  });

  it('selects the replacement passage when a later commit swaps the page', () => {
    const host = document.createElement('div');
    document.body.append(host);

    function mount(text: string) {
      const body = document.createElement('body');
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      body.append(paragraph);
      host.replaceChildren(body);
      vi.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue(rect(0, 40));
      return body;
    }

    const first = mount('First commit');
    markReaderContentCommitted(host);
    armArrowPageSelection(2);
    markReaderContentCommitted(host);
    applyArrowPageSelection(2, first, 0);
    expect(document.getSelection()?.toString()).toBe('First commit');

    first.remove();
    const second = mount('Second commit');
    markReaderContentCommitted(host);
    applyArrowPageSelection(2, second, 0);
    expect(document.getSelection()?.toString()).toBe('Second commit');
    expect(hasSelectedText()).toBe(false);
  });

  it('selects the visible PDF line when the page has no semantic block', () => {
    const host = document.createElement('div');
    const layer = document.createElement('div');
    layer.innerHTML = '<span id="s1">Hel</span><span id="s2">lo</span><span id="s3">next</span>';
    host.append(layer);
    document.body.append(host);
    const s1 = layer.querySelector('#s1');
    const s2 = layer.querySelector('#s2');
    const s3 = layer.querySelector('#s3');
    if (!s1 || !s2 || !s3) throw new Error('missing spans');
    vi.spyOn(s1, 'getBoundingClientRect').mockReturnValue(rect(40, 12));
    vi.spyOn(s2, 'getBoundingClientRect').mockReturnValue(rect(41, 12));
    vi.spyOn(s3, 'getBoundingClientRect').mockReturnValue(rect(70, 12));

    markReaderContentCommitted(host);
    armArrowPageSelection(2);
    markReaderContentCommitted(host);
    applyArrowPageSelection(2, layer, 30);

    expect(document.getSelection()?.toString()).toBe('Hello');
    expect(hasSelectedText()).toBe(false);
  });
});

describe('reading position', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('chooses the block that crosses the reading line and keeps the last block at the end', () => {
    const root = document.createElement('div');
    root.innerHTML = '<h1 id="a">Chapter</h1><p id="b">Middle</p><p id="c">End</p>';
    document.body.append(root);
    const a = root.querySelector('#a');
    const b = root.querySelector('#b');
    const c = root.querySelector('#c');
    if (!a || !b || !c) throw new Error('missing blocks');
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(rect(0, 20));
    vi.spyOn(b, 'getBoundingClientRect').mockReturnValue(rect(20, 40));
    vi.spyOn(c, 'getBoundingClientRect').mockReturnValue(rect(60, 30));

    expect(blockAtReadingPosition(root, 30)?.id).toBe('b');
    expect(blockAtReadingPosition(root, 200)?.id).toBe('c');
  });

  it('marks that block as the current location and moves the mark', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p id="a">One</p><p id="b">Two</p>';
    document.body.append(root);
    const a = root.querySelector('#a');
    const b = root.querySelector('#b');
    if (!a || !b) throw new Error('missing blocks');
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(rect(0, 10));
    vi.spyOn(b, 'getBoundingClientRect').mockReturnValue(rect(10, 40));

    expect(markCurrentReadingBlock(root, 20)?.id).toBe('b');
    expect(b.getAttribute('aria-current')).toBe('location');
    expect(a.getAttribute('aria-current')).toBeNull();

    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(rect(0, 40));
    markCurrentReadingBlock(root, 5);
    expect(a.getAttribute('aria-current')).toBe('location');
    expect(b.getAttribute('aria-current')).toBeNull();
  });

  it('reads the current block, or the first visible text line when there are no blocks', () => {
    const chapter = document.createElement('div');
    chapter.innerHTML = '<p id="p">Hello\n  there</p>';
    document.body.append(chapter);
    const paragraph = chapter.querySelector('p');
    if (!paragraph) throw new Error('missing paragraph');
    vi.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue(rect(0, 40));
    expect(excerptAtReadingPosition(chapter, 10)).toBe('Hello there');

    const layer = document.createElement('div');
    layer.innerHTML = '<span id="s1">Hel</span><span id="s2">lo </span><span id="s3">next</span>';
    document.body.append(layer);
    const s1 = layer.querySelector('#s1');
    const s2 = layer.querySelector('#s2');
    const s3 = layer.querySelector('#s3');
    if (!s1 || !s2 || !s3) throw new Error('missing spans');
    vi.spyOn(s1, 'getBoundingClientRect').mockReturnValue(rect(40, 12));
    vi.spyOn(s2, 'getBoundingClientRect').mockReturnValue(rect(41, 12));
    vi.spyOn(s3, 'getBoundingClientRect').mockReturnValue(rect(70, 12));
    expect(excerptAtReadingPosition(layer, 30)).toBe('Hello');
  });
});

describe('selectionInside', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('accepts a selection in light DOM or an open shadow inside the reader', () => {
    const boundary = document.createElement('article');
    const light = document.createElement('p');
    light.textContent = 'Visible';
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<p>Shadow text</p>';
    boundary.append(light, host);
    document.body.append(boundary);

    expect(selectionInside({ isCollapsed: false, anchorNode: light.firstChild }, boundary)).toBe(
      true,
    );
    const shadowText = shadow.querySelector('p')?.firstChild ?? null;
    expect(selectionInside({ isCollapsed: false, anchorNode: shadowText }, boundary)).toBe(true);
    expect(selectionInside({ isCollapsed: true, anchorNode: shadowText }, boundary)).toBe(false);

    const outside = document.createElement('p');
    outside.textContent = 'No';
    document.body.append(outside);
    expect(selectionInside({ isCollapsed: false, anchorNode: outside.firstChild }, boundary)).toBe(
      false,
    );
  });

  it('collapses whitespace and caps long selections', () => {
    expect(normalizeSelectedText('  hello \n world  ')).toBe('hello world');
    expect(normalizeSelectedText('')).toBe('');
    expect(normalizeSelectedText('abcdef', 4)).toBe('abc…');
  });
});

describe('reader copy', () => {
  it('has the same reader strings in both locales', () => {
    expect(en.reader.documentTitle).toContain('{title}');
    expect(en.reader.passage).toContain('{text}');
    expect(en.reader.selected).toContain('{page}');
    expect(Object.keys(zh.reader).sort()).toEqual(Object.keys(en.reader).sort());
  });
});
