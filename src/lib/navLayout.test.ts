import { describe, expect, it } from 'vitest';

import { shouldCollapseNav, toolbarNavAvailableWidth } from '@/lib/navLayout';

describe('shouldCollapseNav', () => {
  it('is false when nav content fits the available space', () => {
    expect(shouldCollapseNav(400, 500)).toBe(false);
  });

  it('is true when nav content would be clipped', () => {
    expect(shouldCollapseNav(500, 400)).toBe(true);
  });

  it('is true when available width is unknown or empty', () => {
    expect(shouldCollapseNav(400, 0)).toBe(true);
    expect(shouldCollapseNav(400, -10)).toBe(true);
  });

  it('treats an exact fit as not clipped', () => {
    expect(shouldCollapseNav(400, 400)).toBe(false);
  });
});

describe('toolbarNavAvailableWidth', () => {
  it('subtracts toolbar padding, brand size, brand margin, and gap', () => {
    expect(
      toolbarNavAvailableWidth({
        toolbarClientWidth: 405,
        toolbarPaddingLeft: 16,
        toolbarPaddingRight: 16,
        toolbarGap: 8,
        brandWidth: 147,
        brandMarginEnd: 8,
      }),
    ).toBe(210);
  });

  it('is smaller than clientWidth minus brand alone when chrome is present', () => {
    const simple = 405 - 147;
    const available = toolbarNavAvailableWidth({
      toolbarClientWidth: 405,
      toolbarPaddingLeft: 16,
      toolbarPaddingRight: 16,
      toolbarGap: 8,
      brandWidth: 147,
      brandMarginEnd: 8,
    });
    expect(available).toBeLessThan(simple);
    expect(shouldCollapseNav(257, simple)).toBe(false);
    expect(shouldCollapseNav(257, available)).toBe(true);
  });
});
