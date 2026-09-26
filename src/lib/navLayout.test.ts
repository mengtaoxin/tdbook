import { describe, expect, it } from 'vitest';

import { shouldCollapseNav } from '@/lib/navLayout';

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
