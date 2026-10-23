import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '@/i18n/locales/en';
import zh from '@/i18n/locales/zh';
import {
  blockAtReadingPosition,
  excerptAtReadingPosition,
  markCurrentReadingBlock,
  normalizeSelectedText,
  pageArrowDirection,
  selectionInside,
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
