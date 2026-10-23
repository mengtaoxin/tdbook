import Paper from '@mui/material/Paper';
import { useEffect, useRef } from 'react';
import {
  attachEpubShadow,
  clearEpubShadow,
  renderEpubShadow,
  scrollEpubHash,
} from '@/lib/epubShadow';
import type { RewrittenPage } from '@/lib/rewriteHtml';

type EpubReaderPaneProps = {
  rewritten: RewrittenPage;
  hash?: string;
};

export function EpubReaderPane({ rewritten, hash = '' }: EpubReaderPaneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadow = attachEpubShadow(host);
    shadowRef.current = shadow;
    renderEpubShadow(shadow, rewritten, host);
    if (hash) {
      scrollEpubHash(shadow, hash);
    }

    return () => {
      clearEpubShadow(shadowRef.current);
      shadowRef.current = null;
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
