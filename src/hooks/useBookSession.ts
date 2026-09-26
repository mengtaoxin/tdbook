import { useParams, useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TdLog } from 'tdkit';
import { translateError } from '@/i18n';
import { getBook } from '@/lib/bookService';
import { bookPageCount, type BookRecord } from '@/lib/bookTypes';
import type { CacheProgress } from '@/lib/cacheIngest';
import { reportFailure } from '@/lib/reportFailure';

export function useBookSession() {
  const { t } = useTranslation();
  const { id } = useParams({ from: '/book/$id' });

  const [book, setBook] = useState<BookRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cacheProgress, setCacheProgress] = useState<CacheProgress | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setBook(null);
      setCacheProgress({ phase: 'download', loaded: 0, total: null });

      try {
        const nextBook = await getBook(id, (progress) => {
          if (!cancelled) setCacheProgress(progress);
        });
        if (cancelled) return;
        setCacheProgress(null);

        const pages = nextBook ? bookPageCount(nextBook) : 0;
        if (!nextBook || pages === 0) {
          setError(t('reader.notFound'));
          return;
        }

        setBook(nextBook);
      } catch (err) {
        if (cancelled) return;
        setCacheProgress(null);
        const detail = err instanceof Error ? err.message : String(err);
        const message = `Failed to open book id=${id}: ${detail}`;
        reportFailure(message);
        void TdLog.error(message);
        setError(translateError(err, 'reader.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  return { id, book, loading, error, cacheProgress };
}

export function useReaderPageSearch() {
  const page = useRouterState({
    select: (s) => {
      const search = s.location.search as { page?: number };
      return search.page ?? 1;
    },
  });
  const hash = useRouterState({ select: (s) => s.location.hash });
  return { page, hash };
}
