/** Offscreen canvas for a PDF page paint; the visible canvas stays untouched until commit. */
export function createPdfRenderBuffer(pixelWidth: number, pixelHeight: number): HTMLCanvasElement {
  const buffer = document.createElement('canvas');
  buffer.width = Math.max(1, pixelWidth);
  buffer.height = Math.max(1, pixelHeight);
  return buffer;
}

/** Resize the display canvas and blit the finished buffer in one turn (no empty intermediate frame). */
export function commitPdfRenderBuffer(
  display: HTMLCanvasElement,
  buffer: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
): void {
  display.width = buffer.width;
  display.height = buffer.height;
  display.style.width = `${cssWidth}px`;
  display.style.height = `${cssHeight}px`;
  const context = display.getContext('2d');
  if (!context) throw new Error('errors.canvasCreateFailed');
  context.drawImage(buffer, 0, 0);
}
