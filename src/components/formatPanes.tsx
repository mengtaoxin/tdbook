import { EpubReaderPane } from '@/components/EpubReaderPane';
import { PdfReaderPane } from '@/components/PdfReaderPane';
import type { PageContent } from '@/lib/formatAdapter';

export type FormatPaneProps = {
  content: PageContent;
  hash: string;
  onReady: (ready: boolean) => void;
};

export function EpubFormatPane({ content, hash }: FormatPaneProps) {
  if (content.type !== 'epub') return null;
  return <EpubReaderPane rewritten={content.rewritten} hash={hash} />;
}

export function PdfFormatPane({ content, onReady }: FormatPaneProps) {
  if (content.type !== 'pdf') return null;
  return (
    <PdfReaderPane pdfUrl={content.pdfUrl} pageNumber={content.pageNumber} onReady={onReady} />
  );
}
