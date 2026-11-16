import type { PageContent } from '@/lib/formatAdapter';

export function pagerWide(type: PageContent['type']) {
  return type === 'pdf';
}

export function usesPaintGate(type: PageContent['type']) {
  return type === 'pdf';
}

/** Progress chrome only on the first paint; page turns keep the previous page up. */
export function showPaintProgress(awaitingPaint: boolean, hasPaintedPage: boolean) {
  return awaitingPaint && !hasPaintedPage;
}
