import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { formatPanes, pagerWide } from '@/components/formatPanes'
import { ReaderPager } from '@/components/ReaderPager'
import { useReaderSwipe } from '@/hooks/useReaderSwipe'
import type { PageContent } from '@/lib/formatAdapter'
import '@/lib/pdfTextLayer.css'

type FormatReaderPaneProps = {
  content: PageContent
  hash: string
  page: number
  totalPages: number
  prevPage: number | null
  nextPage: number | null
  awaitingPaint: boolean
  onGo: (target: number) => void
  onReady: (ready: boolean) => void
}

export function FormatReaderPane({
  content,
  hash,
  page,
  totalPages,
  prevPage,
  nextPage,
  awaitingPaint,
  onGo,
  onReady,
}: FormatReaderPaneProps) {
  const { t } = useTranslation()
  const Pane = formatPanes[content.type]
  const { swipeBind } = useReaderSwipe({
    onSwipe: (direction) => {
      if (direction === 'prev' && prevPage != null) onGo(prevPage)
      if (direction === 'next' && nextPage != null) onGo(nextPage)
    },
  })

  return (
    <>
      <Box {...swipeBind}>
        <Pane content={content} hash={hash} onReady={onReady} />
      </Box>
      {awaitingPaint ? (
        <Typography align="center" color="text.secondary" sx={{ mt: 2 }}>
          {t('reader.rendering')}
        </Typography>
      ) : null}
      <ReaderPager
        wide={pagerWide(content.type)}
        page={page}
        totalPages={totalPages}
        prevPage={prevPage}
        nextPage={nextPage}
        onGo={onGo}
      />
    </>
  )
}
