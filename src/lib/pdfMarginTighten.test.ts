import { describe, expect, it } from 'vitest';
import {
  clampPdfMarginTighten,
  croppedPdfViewBox,
  PDF_MARGIN_TIGHTEN_DEFAULT,
  PDF_MARGIN_TIGHTEN_MAX,
  PDF_MARGIN_TIGHTEN_MIN,
  pdfMarginTightenLayout,
} from '@/lib/pdfMarginTighten';

describe('pdfMarginTighten', () => {
  it('clamps to the allowed range and defaults non-finite values', () => {
    expect(clampPdfMarginTighten(PDF_MARGIN_TIGHTEN_DEFAULT)).toBe(0);
    expect(clampPdfMarginTighten(-0.5)).toBe(PDF_MARGIN_TIGHTEN_MIN);
    expect(clampPdfMarginTighten(0.5)).toBe(PDF_MARGIN_TIGHTEN_MAX);
    expect(clampPdfMarginTighten(Number.NaN)).toBe(PDF_MARGIN_TIGHTEN_DEFAULT);
    expect(clampPdfMarginTighten(0.123)).toBeCloseTo(0.12, 5);
  });

  it('leaves the view box unchanged when tighten is 0', () => {
    expect(croppedPdfViewBox([0, 0, 100, 200], 0)).toEqual([0, 0, 100, 200]);
  });

  it('crops equal left and right insets and keeps height', () => {
    expect(croppedPdfViewBox([10, 20, 110, 220], 0.1)).toEqual([20, 20, 100, 220]);
  });

  it('scales so the cropped width fills cssWidth with equal side insets', () => {
    const pageWidth = 100;
    const cssWidth = 800;
    expect(pdfMarginTightenLayout(pageWidth, cssWidth, 0)).toEqual({
      scale: 8,
      insetCss: 0,
    });

    const tightened = pdfMarginTightenLayout(pageWidth, cssWidth, 0.1);
    expect(tightened.scale).toBeCloseTo(10, 5);
    expect(tightened.insetCss).toBeCloseTo(100, 5);
    expect(pageWidth * tightened.scale - 2 * tightened.insetCss).toBeCloseTo(cssWidth, 5);
  });
});
