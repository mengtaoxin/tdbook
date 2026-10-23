import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormatReaderPane } from '@/components/FormatReaderPane';
import { usesPaintGate } from '@/components/formatTraits';
import { useBookReader } from '@/hooks/useBookReader';
import { useReadingCursor } from '@/hooks/useReadingCursor';

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

export function BookReaderPage() {
  const { t } = useTranslation();
  const {
    book,
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
  const [paintedContent, setPaintedContent] = useState(pageContent);
  if (paintedContent !== pageContent) {
    setPaintedContent(pageContent);
    setPaintReady(false);
  }

  const awaitingPaint = Boolean(pageContent && usesPaintGate(pageContent.type) && !paintReady);
  const showRenderProgress = loading || (awaitingPaint && !error);
  const formatLabel = book ? t(book.type === 'pdf' ? 'reader.formatPdf' : 'reader.formatEpub') : '';
  const documentTitle = book ? t('reader.documentTitle', { title: book.title }) : '';
  const { passage, selected } = useReadingCursor(
    `${book?.id ?? ''}:${page}:${pageContent?.type ?? 'loading'}`,
  );

  useEffect(() => {
    if (!documentTitle) return;
    const previous = document.title;
    document.title = documentTitle;
    return () => {
      document.title = previous;
    };
  }, [documentTitle]);

  return (
    <Container maxWidth={false} sx={{ py: 2, maxWidth: 960 }}>
      {book ? (
        <Box component="header" sx={{ mb: 2 }}>
          <Typography id="reader-book-title" variant="h5" component="h1">
            {book.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {book.author
              ? t('reader.byline', { author: book.author, format: formatLabel })
              : formatLabel}
          </Typography>
        </Box>
      ) : null}

      {progressLabel ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {progressLabel}
          </Typography>
          <LinearProgress
            aria-label={progressLabel}
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
        <LinearProgress aria-label={t('reader.rendering')} sx={{ mb: 3 }} />
      ) : null}

      {error && !loading ? <Alert severity="error">{error}</Alert> : null}

      {pageContent && !error ? (
        <Box
          component="article"
          data-testid="reader-article"
          aria-labelledby={book ? 'reader-book-title' : undefined}
          sx={{ position: 'relative' }}
        >
          {passage ? (
            <Box component="p" id="reader-passage" data-testid="reader-passage" sx={visuallyHidden}>
              {t('reader.passage', { text: passage })}
            </Box>
          ) : null}
          <FormatReaderPane
            content={pageContent}
            hash={hash ?? ''}
            page={page}
            totalPages={totalPages}
            prevPage={prevPage}
            nextPage={nextPage}
            awaitingPaint={awaitingPaint}
            onGo={goToPage}
            onReady={setPaintReady}
          />
          {selected ? (
            <Box
              component="p"
              id="reader-selection"
              data-testid="reader-selection"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              sx={visuallyHidden}
            >
              {t('reader.selected', { page, text: selected })}
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Container>
  );
}
