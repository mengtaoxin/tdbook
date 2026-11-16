import { describe, expect, it } from 'vitest';
import { showPaintProgress } from '@/components/formatTraits';

describe('showPaintProgress', () => {
  it('shows progress only for the first paint, not while turning pages', () => {
    expect(showPaintProgress(true, false)).toBe(true);
    expect(showPaintProgress(true, true)).toBe(false);
    expect(showPaintProgress(false, false)).toBe(false);
    expect(showPaintProgress(false, true)).toBe(false);
  });
});
