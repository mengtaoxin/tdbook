import Paper from '@mui/material/Paper';
import { useEffect, useRef } from 'react';
import { clearEpubContent, renderEpubContent, scrollEpubHash } from '@/lib/epubShadow';
import { markReaderContentCommitted } from '@/lib/readerA11y';
import type { RewrittenPage } from '@/lib/rewriteHtml';

type EpubReaderPaneProps = {
  rewritten: RewrittenPage;
  hash?: string;
};

export function EpubReaderPane({ rewritten, hash = '' }: EpubReaderPaneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const controller = new AbortController();
    void renderEpubContent(host, rewritten, controller.signal)
      .then(() => {
        if (controller.signal.aborted) return;
        if (hash) scrollEpubHash(host, hash);
        markReaderContentCommitted(host);
      })
      .catch(() => {
        // Abort or a failed stylesheet leaves the previous clear in place.
      });

    return () => {
      controller.abort();
      clearEpubContent(host);
    };
  }, [rewritten, hash]);

  return (
    <Paper
      elevation={3}
      sx={{
        mx: 'auto',
        p: { xs: 3, sm: 5 },
        maxWidth: 720,
        minHeight: '70vh',
        borderRadius: 1,
      }}
    >
      <div ref={hostRef} className="epub-content" data-testid="epub-content" />
    </Paper>
  );
}
