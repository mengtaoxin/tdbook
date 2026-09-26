export type ReaderSwipeDirection = 'prev' | 'next';

const DEFAULT_THRESHOLD = 50;

export function decideReaderSwipe(input: {
  dx: number;
  dy: number;
  threshold?: number;
}): ReaderSwipeDirection | null {
  const threshold = input.threshold ?? DEFAULT_THRESHOLD;
  const absDx = Math.abs(input.dx);
  const absDy = Math.abs(input.dy);
  if (absDx < threshold) return null;
  if (absDx <= absDy) return null;
  return input.dx < 0 ? 'next' : 'prev';
}
