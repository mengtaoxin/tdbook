import { describe, expect, it, vi } from 'vitest';
import { commitPdfRenderBuffer, createPdfRenderBuffer } from '@/lib/pdfRenderBuffer';

describe('pdfRenderBuffer', () => {
  it('creates an offscreen buffer sized to the pixel bounds', () => {
    const buffer = createPdfRenderBuffer(8, 4);
    expect(buffer.width).toBe(8);
    expect(buffer.height).toBe(4);
  });

  it('commits buffer pixels onto the display canvas only at commit time', () => {
    const display = document.createElement('canvas');
    display.width = 4;
    display.height = 2;
    const buffer = createPdfRenderBuffer(8, 4);
    const drawImage = vi.fn();
    vi.spyOn(display, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    expect(display.width).toBe(4);
    expect(display.height).toBe(2);

    commitPdfRenderBuffer(display, buffer, 100, 50);

    expect(display.width).toBe(8);
    expect(display.height).toBe(4);
    expect(display.style.width).toBe('100px');
    expect(display.style.height).toBe('50px');
    expect(drawImage).toHaveBeenCalledWith(buffer, 0, 0);
  });
});
