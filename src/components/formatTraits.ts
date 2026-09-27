import type { PageContent } from '@/lib/formatAdapter';

export function pagerWide(type: PageContent['type']) {
  return type === 'pdf';
}

export function usesPaintGate(type: PageContent['type']) {
  return type === 'pdf';
}
