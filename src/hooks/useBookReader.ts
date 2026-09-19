import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TdLog } from 'tdkit'
import { useBookSession, useReaderPageSearch } from '@/hooks/useBookSession'
import { bookPageCount } from '@/lib/bookTypes'
import { getBookPage, type PageContent } from '@/lib/formats'
import { reportFailure } from '@/lib/reportFailure'

export function useBookReader() {
  const { t } = useTranslation()
  const {
    id,
    book,
    loading: sessionLoading,
    error: sessionError,
    cacheProgress,
  } = useBookSession()
  const { page, hash } = useReaderPageSearch()
  const navigate = useNavigate()

  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [pageError, setPageError] = useState('')
  const [pageLoading, setPageLoading] = useState(false)
  const loadedBookIdRef = useRef<string | null>(null)

  const totalPages = book ? bookPageCount(book) : 0
  const prevPage = book && page > 1 ? page - 1 : null
  const nextPage = book && page < totalPages ? page + 1 : null

  const progressLabel = useMemo(() => {
    if (!cacheProgress || cacheProgress.phase === 'done') return ''
    if (cacheProgress.phase === 'download') {
      if (cacheProgress.total && cacheProgress.total > 0) {
        const pct = Math.min(
          100,
          Math.round((cacheProgress.loaded / cacheProgress.total) * 100),
        )
        return t('reader.downloadingPct', { pct })
      }
      return t('reader.downloading')
    }
    if (cacheProgress.phase === 'extract') {
      if (cacheProgress.total && cacheProgress.total > 0) {
        return t('reader.extractingProgress', {
          loaded: cacheProgress.loaded,
          total: cacheProgress.total,
        })
      }
      return t('reader.extracting')
    }
    return ''
  }, [cacheProgress, t])

  const goToPage = useCallback(
    (target: number) => {
      void navigate({
        to: '/book/$id',
        params: { id },
        search: { page: target },
      })
    },
    [navigate, id],
  )

  useEffect(() => {
    if (loadedBookIdRef.current !== book?.id) {
      loadedBookIdRef.current = book?.id ?? null
      setPageContent(null)
    }

    if (sessionError || !book) {
      setPageError('')
      if (!book) setPageContent(null)
      setPageLoading(false)
      return
    }

    let cancelled = false
    const sessionBook = book

    async function loadPage() {
      const pages = bookPageCount(sessionBook)
      if (!Number.isInteger(page) || page < 1 || page > pages) {
        if (!cancelled) {
          setPageError(t('reader.invalidPage'))
          setPageContent(null)
          setPageLoading(false)
        }
        return
      }

      setPageLoading(true)
      try {
        const content = await getBookPage(sessionBook, page - 1)
        if (cancelled) return
        if (!content) {
          setPageError(t('reader.pageLoadFailed'))
          return
        }
        setPageError('')
        setPageContent(content)
      } catch (err) {
        if (cancelled) return
        const detail = err instanceof Error ? err.message : String(err)
        const message = `Failed to load page ${page} for book id=${sessionBook.id}: ${detail}`
        reportFailure(message)
        void TdLog.error(message)
        setPageError(t('reader.pageLoadFailed'))
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    }

    void loadPage()
    return () => {
      cancelled = true
    }
  }, [book, sessionError, page, t])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && prevPage != null) {
        goToPage(prevPage)
      }
      if (event.key === 'ArrowRight' && nextPage != null) {
        goToPage(nextPage)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goToPage, prevPage, nextPage])

  const error = sessionError || pageError
  const loading = sessionLoading || (pageLoading && !pageContent)

  return {
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
  }
}
