/* oxlint-disable react/only-export-components -- exports row factory used by Menu/List shells */
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryIcon from '@mui/icons-material/History';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import type { ReaderBookmarksState } from '@/hooks/useReaderBookmarks';
import { type Bookmark, formatBookmarkTime } from '@/lib/bookmarks';

type RowProps = {
  inMenu: boolean;
  testId: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Injected by MUI `MenuList` for keyboard focus. */
  autoFocus?: boolean;
  tabIndex?: number;
};

function BookmarkRow({ inMenu, testId, ...props }: RowProps) {
  return inMenu ? (
    <MenuItem data-testid={testId} {...props} />
  ) : (
    <ListItemButton data-testid={testId} sx={{ pl: 4 }} {...props} />
  );
}

/** Rows are returned as an array so `Menu` sees each `MenuItem` as a direct child. */
export function bookmarkRows(
  inMenu: boolean,
  state: ReaderBookmarksState,
  t: TFunction,
  locale: string,
): ReactNode[] {
  const { now, groups, saveCurrent, jump, edit } = state;
  const subheaderSx = { lineHeight: '32px', bgcolor: 'transparent', pl: inMenu ? 2 : 4 };

  function item(bookmark: Bookmark) {
    const isNamed = bookmark.name !== undefined;
    return (
      <BookmarkRow
        key={bookmark.id}
        inMenu={inMenu}
        testId={`bookmark-item-${bookmark.id}`}
        onClick={() => jump(bookmark)}
      >
        <ListItemIcon>
          {isNamed ? <BookmarkIcon fontSize="small" /> : <HistoryIcon fontSize="small" />}
        </ListItemIcon>
        <ListItemText
          primary={bookmark.name ?? formatBookmarkTime(bookmark.savedAt, now, locale)}
          secondary={t('bookmarks.page', { page: bookmark.page })}
        />
        <IconButton
          edge="end"
          size="small"
          aria-label={t('bookmarks.edit')}
          data-testid={`bookmark-edit-${bookmark.id}`}
          sx={{ ml: 1 }}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            edit(bookmark);
          }}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </BookmarkRow>
    );
  }

  const rows: ReactNode[] = [
    <BookmarkRow key="save" inMenu={inMenu} testId="bookmark-save" onClick={saveCurrent}>
      <ListItemIcon sx={{ color: 'primary.main' }}>
        <BookmarkAddOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={t('bookmarks.save')}
        slotProps={{ primary: { sx: { color: 'primary.main', fontWeight: 600 } } }}
      />
    </BookmarkRow>,
    <Divider key="save-divider" />,
  ];

  if (groups.named.length === 0 && groups.recent.length === 0) {
    rows.push(
      <BookmarkRow key="empty" inMenu={inMenu} testId="bookmark-empty" disabled>
        <ListItemText primary={t('bookmarks.empty')} />
      </BookmarkRow>,
    );
    return rows;
  }
  if (groups.named.length > 0) {
    rows.push(
      <ListSubheader key="named" disableSticky sx={subheaderSx}>
        {t('bookmarks.named')}
      </ListSubheader>,
      ...groups.named.map(item),
    );
  }
  if (groups.recent.length > 0) {
    rows.push(
      <ListSubheader key="recent" disableSticky sx={subheaderSx}>
        {t('bookmarks.recent')}
      </ListSubheader>,
      ...groups.recent.map(item),
    );
  }
  return rows;
}
