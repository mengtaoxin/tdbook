import Paper from '@mui/material/Paper';
import { useEffect, useRef } from 'react';
import { loadPdfDocument, renderPdfPage, type PdfPageRender } from '@/lib/pdfReader';

type PdfReaderPaneProps = {
  pdfUrl: string;
  pageNumber: number;
  onReady: (ready: boolean) => void;
};

export function PdfReaderPane({ pdfUrl, pageNumber, onReady }: PdfReaderPaneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const paintRef = useRef<PdfPageRender | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const lastWidthRef = useRef(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let disposed = false;
    let paintSeq = 0;

    function stopPaint() {
      paintRef.current?.cancel();
      paintRef.current = null;
    }

    function stopResizeObserver() {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      lastWidthRef.current = 0;
    }

    async function paintPage() {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      const textLayer = textLayerRef.current;
      const pageNode = pageRef.current;
      if (!host || !canvas || !textLayer || !pageNode || disposed) return;

      const cssWidth = Math.floor(host.clientWidth);
      if (cssWidth < 32) return;

      const seq = ++paintSeq;
      stopPaint();
      onReadyRef.current(false);

      const doc = await loadPdfDocument(pdfUrl);
      if (disposed || seq !== paintSeq) return;

      const task = renderPdfPage(doc, pageNumber, {
        canvas,
        textLayerEl: textLayer,
        pageEl: pageNode,
        cssWidth,
      });
      paintRef.current = task;
      try {
        await task.promise;
      } catch {
        // Cancelled or render error; readiness stays false
      }
      if (!disposed && seq === paintSeq && paintRef.current === task) {
        onReadyRef.current(true);
      }
    }

    function observeHost() {
      stopResizeObserver();
      const host = hostRef.current;
      if (!host) return;

      resizeObserverRef.current = new ResizeObserver(() => {
        const width = Math.floor(host.clientWidth);
        if (Math.abs(width - lastWidthRef.current) < 1) return;
        lastWidthRef.current = width;
        void paintPage();
      });
      resizeObserverRef.current.observe(host);
    }

    observeHost();
    void paintPage();

    return () => {
      disposed = true;
      paintSeq += 1;
      stopPaint();
      stopResizeObserver();
    };
  }, [pdfUrl, pageNumber]);

  return (
    <Paper elevation={3} sx={{ mx: 'auto', maxWidth: 900, borderRadius: 1, overflow: 'hidden' }}>
      <div ref={hostRef} className="pdf-host" data-testid="pdf-host" style={{ width: '100%' }}>
        <div ref={pageRef} className="pdf-page">
          <canvas ref={canvasRef} />
          <div ref={textLayerRef} className="textLayer" />
        </div>
      </div>
    </Paper>
  );
}
