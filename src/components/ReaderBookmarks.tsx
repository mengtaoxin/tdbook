import List from '@mui/material/List';
import Menu from '@mui/material/Menu';
import { useTranslation } from 'react-i18next';
import { useReaderBookmarks } from '@/hooks/useReaderBookmarks';
import { useLocaleStore } from '@/stores/localeStore';
import { bookmarkRows } from './BookmarkRows';
import type { ReaderBookmarksProps } from './readerBookmarksTypes';

export type { BookmarkNoticeType } from './readerBookmarksTypes';

export function ReaderBookmarksMenu({
  anchorEl,
  ...props
}: ReaderBookmarksProps & { anchorEl: HTMLElement | null }) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const state = useReaderBookmarks(props);
  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={props.onDone}
        data-testid="nav-bookmarks-menu"
        slotProps={{ paper: { sx: { minWidth: 260 } } }}
      >
        {bookmarkRows(true, state, t, locale)}
      </Menu>
      {state.dialog}
    </>
  );
}

export function ReaderBookmarksList(props: ReaderBookmarksProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const state = useReaderBookmarks(props);
  return (
    <>
      <List dense disablePadding>
        {bookmarkRows(false, state, t, locale)}
      </List>
      {state.dialog}
    </>
  );
}
