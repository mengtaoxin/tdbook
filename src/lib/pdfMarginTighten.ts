/** Fraction of page width cropped from each of left and right (0 = full page). */
export const PDF_MARGIN_TIGHTEN_MIN = 0;
export const PDF_MARGIN_TIGHTEN_MAX = 0.2;
export const PDF_MARGIN_TIGHTEN_DEFAULT = 0;

/** Snap to 1% steps, then clamp into the allowed range. Non-finite → default. */
export function clampPdfMarginTighten(value: number): number {
  if (!Number.isFinite(value)) return PDF_MARGIN_TIGHTEN_DEFAULT;
  const stepped = Math.round(value * 100) / 100;
  return Math.min(PDF_MARGIN_TIGHTEN_MAX, Math.max(PDF_MARGIN_TIGHTEN_MIN, stepped));
}

/** True when a stored value is already in range (invalid / out-of-range entries are dropped). */
export function isPdfMarginTightenValue(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= PDF_MARGIN_TIGHTEN_MIN &&
    value <= PDF_MARGIN_TIGHTEN_MAX
  );
}

/**
 * Crop equal left/right insets from a PDF view box `[xMin, yMin, xMax, yMax]`.
 * Height is unchanged. `tighten` is the fraction of width removed on each side.
 */
export function croppedPdfViewBox(
  viewBox: readonly [number, number, number, number],
  tighten: number,
): [number, number, number, number] {
  const [xMin, yMin, xMax, yMax] = viewBox;
  const inset = (xMax - xMin) * clampPdfMarginTighten(tighten);
  return [xMin + inset, yMin, xMax - inset, yMax];
}

/**
 * Scale the full page so the horizontally cropped region fills `cssWidth`.
 * `insetCss` is the CSS px to shift left so equal left/right margins are clipped.
 */
export function pdfMarginTightenLayout(
  pageWidth: number,
  cssWidth: number,
  tighten: number,
): { scale: number; insetCss: number } {
  const t = clampPdfMarginTighten(tighten);
  const visibleFraction = 1 - 2 * t;
  const scale = cssWidth / (pageWidth * visibleFraction);
  const insetCss = pageWidth * t * scale;
  return { scale, insetCss };
}
