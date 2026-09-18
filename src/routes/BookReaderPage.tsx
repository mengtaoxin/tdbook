import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { EpubReaderPane } from '@/components/EpubReaderPane'
import { PdfReaderPane } from '@/components/PdfReaderPane'
import { ReaderPager } from '@/components/ReaderPager'
import { useBookReader } from '@/hooks/useBookReader'
import '@/lib/pdfTextLayer.css'

export function BookReaderPage() {
  const { t } = useTranslation()
  const {
    book,
    page,
    pageContent,
    loading,
    error,
    pdfReady,
    setPdfReady,
    cacheProgress,
    progressLabel,
    totalPages,
    prevPage,
    nextPage,
    hash,
    goToPage,
  } = useBookReader()

  const showRenderProgress =
    loading || (pageContent?.type === 'pdf' && !pdfReady && !error)

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
                ? Math.min(
                    100,
                    (cacheProgress.loaded / cacheProgress.total) * 100,
                  )
                : 0
            }
            sx={{ mb: 3 }}
          />
        </>
      ) : showRenderProgress ? (
        <LinearProgress sx={{ mb: 3 }} />
      ) : null}

      {error && !loading ? (
        <Alert severity="error">{error}</Alert>
      ) : null}

      {pageContent?.type === 'pdf' && book && !error ? (
        <>
          <PdfReaderPane
            pdfUrl={pageContent.pdfUrl}
            pageNumber={pageContent.pageNumber}
            onReady={setPdfReady}
          />
          {!pdfReady ? (
            <Typography
              align="center"
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              {t('reader.rendering')}
            </Typography>
          ) : null}
          <ReaderPager
            wide
            page={page}
            totalPages={totalPages}
            prevPage={prevPage}
            nextPage={nextPage}
            onGo={goToPage}
          />
        </>
      ) : null}

      {pageContent?.type === 'epub' && book && !error ? (
        <>
          <EpubReaderPane rewritten={pageContent.rewritten} hash={hash} />
          <ReaderPager
            page={page}
            totalPages={totalPages}
            prevPage={prevPage}
            nextPage={nextPage}
            onGo={goToPage}
          />
        </>
      ) : null}
    </Container>
  )
}
