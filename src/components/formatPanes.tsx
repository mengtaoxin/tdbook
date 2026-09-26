import type { ComponentType } from 'react';
import { EpubReaderPane } from '@/components/EpubReaderPane';
import { PdfReaderPane } from '@/components/PdfReaderPane';
import type { PageContent } from '@/lib/formatAdapter';

export type FormatPaneProps = {
  content: PageContent;
  hash: string;
  onReady: (ready: boolean) => void;
};

function EpubFormatPane({ content, hash }: FormatPaneProps) {
  if (content.type !== 'epub') return null;
  return <EpubReaderPane rewritten={content.rewritten} hash={hash} />;
}

function PdfFormatPane({ content, onReady }: FormatPaneProps) {
  if (content.type !== 'pdf') return null;
  return (
    <PdfReaderPane pdfUrl={content.pdfUrl} pageNumber={content.pageNumber} onReady={onReady} />
  );
}

export const formatPanes: {
  [K in PageContent['type']]: ComponentType<FormatPaneProps>;
} = {
  epub: EpubFormatPane,
  pdf: PdfFormatPane,
};

export function pagerWide(type: PageContent['type']) {
  return type === 'pdf';
}

export function usesPaintGate(type: PageContent['type']) {
  return type === 'pdf';
}
