import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OPS } from 'pdfjs-dist';
import { canvasShouldPaintOperator } from '@/lib/pdfReader';

const textLayerCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'pdfTextLayer.css'),
  'utf8',
);

describe('pdf reader selection', () => {
  it('does not paint text operators onto the canvas', () => {
    expect(canvasShouldPaintOperator(OPS.showText)).toBe(false);
    expect(canvasShouldPaintOperator(OPS.showSpacedText)).toBe(false);
    expect(canvasShouldPaintOperator(OPS.nextLineShowText)).toBe(false);
    expect(canvasShouldPaintOperator(OPS.nextLineSetSpacingShowText)).toBe(false);
    expect(canvasShouldPaintOperator(OPS.paintImageXObject)).toBe(true);
    expect(canvasShouldPaintOperator(OPS.fill)).toBe(true);
  });

  it('keeps the text layer selectable and visible as text', () => {
    expect(textLayerCss).not.toMatch(/user-select:\s*none/);
    expect(textLayerCss).not.toMatch(/color:\s*transparent/);
    expect(textLayerCss).toMatch(/user-select:\s*text/);
  });
});
