import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { BookmarkEditDialog } from '@/components/BookmarkEditDialog';
import type { ReaderBookmarksProps } from '@/components/readerBookmarksTypes';
import { translateError } from '@/i18n';
import { type Bookmark, groupBookBookmarks } from '@/lib/bookmarks';
import { captureReaderLocation, locationToRouterHash } from '@/lib/epubAnchor';
import { useBookmarksStore } from '@/stores/bookmarksStore';

const MINUTE_MS = 60_000;

function subscribeMinute(onTick: () => void) {
  const id = setInterval(onTick, MINUTE_MS);
  return () => clearInterval(id);
}

function currentMinute() {
  return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

export function useReaderBookmarks({ bookId, onDone, onNotice }: ReaderBookmarksProps) {
  const { t } = useTranslation();
  const now = useSyncExternalStore(subscribeMinute, currentMinute);
  const navigate = useNavigate();
  const page = useRouterState({
    select: (s) => (s.location.search as { page?: number }).page ?? 1,
  });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const save = useBookmarksStore((s) => s.save);
  const [editing, setEditing] = useState<Bookmark | null>(null);

  function saveCurrent() {
    try {
      // Prefer content-stable EPUB anchors (#char:N) over URL hash / scroll ratios
      // so resize of the browser window does not drift the restored position.
      save({ bookId, page, location: captureReaderLocation() || hash });
      onNotice('success', t('bookmarks.saved'));
    } catch (err) {
      onNotice('error', translateError(err, 'bookmarks.saveFailed'));
    }
    onDone();
  }

  function jump(bookmark: Bookmark) {
    void navigate({
      to: '/book/$id',
      params: { id: bookId },
      search: { page: bookmark.page },
      hash: locationToRouterHash(bookmark.location),
    });
    onDone();
  }

  return {
    now,
    groups: groupBookBookmarks(bookmarks, bookId),
    saveCurrent,
    jump,
    edit: setEditing,
    dialog: editing ? (
      <BookmarkEditDialog
        key={editing.id}
        bookmark={editing}
        currentPosition={() => ({ page, location: captureReaderLocation() || hash })}
        onClose={() => setEditing(null)}
        onNotice={onNotice}
      />
    ) : null,
  };
}

export type ReaderBookmarksState = ReturnType<typeof useReaderBookmarks>;
