import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { FormatReaderPane } from '@/components/FormatReaderPane';
import { showPaintProgress, usesPaintGate } from '@/components/formatTraits';
import { useBookReader } from '@/hooks/useBookReader';

export function BookReaderPage() {
  const {
    id,
    page,
    pageContent,
    loading,
    error,
    cacheProgress,
    progressLabel,
    totalPages,
    prevPage,
    nextPage,
    hash,
    goToPage,
  } = useBookReader();
  const [paintReady, setPaintReady] = useState(false);
  const [hasPaintedPage, setHasPaintedPage] = useState(false);
  const [paintedContent, setPaintedContent] = useState(pageContent);
  if (paintedContent !== pageContent) {
    setPaintedContent(pageContent);
    setPaintReady(false);
    if (!pageContent) setHasPaintedPage(false);
  }

  const awaitingPaint = Boolean(pageContent && usesPaintGate(pageContent.type) && !paintReady);
  const paintChrome = showPaintProgress(awaitingPaint, hasPaintedPage);
  const showRenderProgress = loading || (paintChrome && !error);

  function handlePaintReady(ready: boolean) {
    setPaintReady(ready);
    if (ready) setHasPaintedPage(true);
  }

  return (
    <Container maxWidth={false} sx={{ py: 2, maxWidth: 960 }}>
      {progressLabel ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {progressLabel}
          </Typography>
          <LinearProgress
            variant={cacheProgress?.total ? 'determinate' : 'indeterminate'}
            value={
              cacheProgress?.total
                ? Math.min(100, (cacheProgress.loaded / cacheProgress.total) * 100)
                : 0
            }
            sx={{ mb: 3 }}
          />
        </>
      ) : showRenderProgress ? (
        <LinearProgress sx={{ mb: 3 }} />
      ) : null}

      {error && !loading ? <Alert severity="error">{error}</Alert> : null}

      {pageContent && !error ? (
        <FormatReaderPane
          bookId={id}
          content={pageContent}
          hash={hash ?? ''}
          page={page}
          totalPages={totalPages}
          prevPage={prevPage}
          nextPage={nextPage}
          awaitingPaint={paintChrome}
          onGo={goToPage}
          onReady={handlePaintReady}
        />
      ) : null}
    </Container>
  );
}
