import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  captureEpubAnchor,
  captureReaderLocation,
  formatCharLocation,
  locationToRouterHash,
  normalizeAnchorLocation,
  parseCharLocation,
  scrollEpubAnchor,
  textPositionAtCharOffset,
} from '@/lib/epubAnchor';
import { attachEpubShadow, renderEpubShadow } from '@/lib/epubShadow';
import type { RewrittenPage } from '@/lib/rewriteHtml';

function page(html: string): RewrittenPage {
  return {
    html,
    bodyClass: '',
    lang: 'en',
    stylesheetUrls: [],
    inlineStyles: [],
  };
}

function mountEpub(html: string) {
  const host = document.createElement('div');
  host.setAttribute('data-testid', 'epub-content');
  host.className = 'epub-content';
  document.body.appendChild(host);
  const shadow = attachEpubShadow(host);
  renderEpubShadow(shadow, page(html), host);
  return { host, shadow };
}

function mockZeroSizeRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON() {
      return this;
    },
    ...overrides,
  };
}

describe('epubAnchor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('formats and parses content-stable char locations', () => {
    expect(formatCharLocation(0)).toBe('#char:0');
    expect(formatCharLocation(42.9)).toBe('#char:42');
    expect(formatCharLocation(-3)).toBe('#char:0');
    expect(parseCharLocation('#char:12')).toBe(12);
    expect(parseCharLocation('##char:12')).toBe(12);
    expect(parseCharLocation('char:12')).toBe(12);
    expect(parseCharLocation('#top')).toBeNull();
    expect(parseCharLocation('')).toBeNull();
    expect(parseCharLocation('#char:')).toBeNull();
    expect(normalizeAnchorLocation('##char:3')).toBe('#char:3');
    expect(locationToRouterHash('#char:3')).toBe('char:3');
  });

  it('maps a char offset back to the matching text node', () => {
    const { shadow } = mountEpub('<p>Hi</p><p>there</p>');
    const body = shadow.querySelector('body');
    expect(body).toBeTruthy();

    expect(textPositionAtCharOffset(body!, 0)?.node.textContent).toBe('Hi');
    expect(textPositionAtCharOffset(body!, 0)?.offset).toBe(0);
    expect(textPositionAtCharOffset(body!, 2)?.node.textContent).toBe('there');
    expect(textPositionAtCharOffset(body!, 2)?.offset).toBe(0);
    expect(textPositionAtCharOffset(body!, 4)?.node.textContent).toBe('there');
    expect(textPositionAtCharOffset(body!, 4)?.offset).toBe(2);
    expect(textPositionAtCharOffset(body!, 99)).toBeNull();
  });

  it('captures the char offset of text at the viewport top, not a scroll ratio', () => {
    const { host, shadow } = mountEpub('<p id="a">AAAA</p><p id="b">BBBB</p><p id="c">CCCC</p>');

    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue(
      mockZeroSizeRect({ y: -40, top: -40, width: 400, height: 900, right: 400, bottom: 860 }),
    );

    vi.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(function (this: Range) {
      const nodeText = this.startContainer.textContent ?? '';
      if (nodeText === 'AAAA') {
        return mockZeroSizeRect({ y: -80, top: -80, width: 100, height: 20, right: 100, bottom: -60 });
      }
      if (nodeText === 'BBBB') {
        const start = this.startOffset;
        const end = this.endOffset;
        if (start === 0 && end === nodeText.length) {
          return mockZeroSizeRect({
            y: -10,
            top: -10,
            width: 100,
            height: 40,
            right: 100,
            bottom: 30,
          });
        }
        const top = -10 + start * 10;
        return mockZeroSizeRect({ y: top, top, width: 10, height: 10, right: 10, bottom: top + 10 });
      }
      return mockZeroSizeRect({ y: 40, top: 40, width: 100, height: 20, right: 100, bottom: 60 });
    });

    // Visible top is y=0. "AAAA" is above; first "BBBB" char with top >= 0 is index 1 → #char:5
    expect(captureEpubAnchor(shadow, { viewportTop: 0 })).toBe('#char:5');
  });

  it('restores a char location by scrolling that text into view', () => {
    const { shadow } = mountEpub('<p>Hello</p><p>World</p>');
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    scrollEpubAnchor(shadow, '##char:5');
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('still restores legacy element-id locations', () => {
    const { shadow } = mountEpub('<h1 id="top">Title</h1><p>Body</p>');
    const heading = shadow.getElementById('top');
    const scrollIntoView = vi.fn();
    if (heading) heading.scrollIntoView = scrollIntoView;

    scrollEpubAnchor(shadow, '#top');
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('reads the live reader host when saving a bookmark location', () => {
    const { host, shadow } = mountEpub('<p>Hello</p><p>World</p>');
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue(
      mockZeroSizeRect({ width: 400, height: 200, right: 400, bottom: 200 }),
    );
    // No app bar in the unit test document → visible top is the host top (0).
    vi.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(function (this: Range) {
      const nodeText = this.startContainer.textContent ?? '';
      if (nodeText === 'Hello') {
        return mockZeroSizeRect({ y: -20, top: -20, bottom: -5, width: 40, height: 15, right: 40 });
      }
      const start = this.startOffset;
      const end = this.endOffset;
      if (start === 0 && end === nodeText.length) {
        return mockZeroSizeRect({ y: 0, top: 0, bottom: 20, width: 40, height: 20, right: 40 });
      }
      const top = start * 4;
      return mockZeroSizeRect({ y: top, top, bottom: top + 4, width: 4, height: 4, right: 4 });
    });

    expect(shadow.querySelector('body')).toBeTruthy();
    // "Hello"(5) + start of "World"
    expect(captureReaderLocation()).toBe('#char:5');
  });
});
