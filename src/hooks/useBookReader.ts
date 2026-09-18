import { useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateError } from '@/i18n'
import { type CacheProgress } from '@/lib/bookCache'
import { getBook } from '@/lib/bookService'
import { bookPageCount, type BookRecord } from '@/lib/bookTypes'
import { getFormatAdapter, type PageContent } from '@/lib/formats'

export function useBookReader() {
  const { t } = useTranslation()
  const { id } = useParams({ from: '/book/$id' })
  const page = useRouterState({
    select: (s) => {
      const search = s.location.search as { page?: number }
      return search.page ?? 1
    },
  })
  const hash = useRouterState({ select: (s) => s.location.hash })
  const navigate = useNavigate()

  const [book, setBook] = useState<BookRecord | null>(null)
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfReady, setPdfReady] = useState(false)
  const [cacheProgress, setCacheProgress] = useState<CacheProgress | null>(null)
  const bookRef = useRef<BookRecord | null>(null)
  bookRef.current = book

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
    let cancelled = false

    async function load() {
      setError('')
      setPageContent(null)
      setPdfReady(false)

      const current = bookRef.current
      const switchingBook = !current || current.id !== id
      if (switchingBook || current?.type !== 'pdf') {
        setLoading(true)
      }

      try {
        let nextBook = current
        if (switchingBook) {
          setCacheProgress({ phase: 'download', loaded: 0, total: null })
          nextBook = await getBook(id, (progress) => {
            if (!cancelled) setCacheProgress(progress)
          })
          if (cancelled) return
          setCacheProgress(null)
          setBook(nextBook)
        }

        const pages = nextBook ? bookPageCount(nextBook) : 0
        if (!nextBook || pages === 0) {
          if (!cancelled) setError(t('reader.notFound'))
          return
        }

        if (
          !Number.isInteger(page) ||
          page < 1 ||
          page > pages
        ) {
          if (!cancelled) setError(t('reader.invalidPage'))
          return
        }

        const adapter = getFormatAdapter(nextBook.type)
        const content = await adapter.getPage(nextBook, page - 1)
        if (cancelled) return
        if (!content) {
          setError(t('reader.pageLoadFailed'))
          return
        }

        setPageContent(content)
      } catch (err) {
        if (cancelled) return
        setCacheProgress(null)
        setError(translateError(err, 'reader.loadFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id, page, t])

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

  return {
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
  }
}
