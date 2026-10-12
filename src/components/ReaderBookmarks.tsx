import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryIcon from '@mui/icons-material/History';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { TFunction } from 'i18next';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { type FormEvent, type ReactNode, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { translateError } from '@/i18n';
import { type Bookmark, formatBookmarkTime, groupBookBookmarks } from '@/lib/bookmarks';
import { captureReaderLocation, locationToRouterHash } from '@/lib/epubAnchor';
import { useBookmarksStore } from '@/stores/bookmarksStore';
import { useLocaleStore } from '@/stores/localeStore';

export type BookmarkNoticeType = 'success' | 'error';

type ReaderBookmarksProps = {
  bookId: string;
  /** Close the surrounding menu / drawer after a save or jump. */
  onDone: () => void;
  onNotice: (type: BookmarkNoticeType, message: string) => void;
};

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

function Row({ inMenu, testId, ...props }: RowProps) {
  return inMenu ? (
    <MenuItem data-testid={testId} {...props} />
  ) : (
    <ListItemButton data-testid={testId} sx={{ pl: 4 }} {...props} />
  );
}

const MINUTE_MS = 60_000;

function subscribeMinute(onTick: () => void) {
  const id = setInterval(onTick, MINUTE_MS);
  return () => clearInterval(id);
}

function currentMinute() {
  return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

function useReaderBookmarks({ bookId, onDone, onNotice }: ReaderBookmarksProps) {
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
        onClose={() => setEditing(null)}
        onNotice={onNotice}
      />
    ) : null,
  };
}

/** Rows are returned as an array so `Menu` sees each `MenuItem` as a direct child. */
function bookmarkRows(
  inMenu: boolean,
  state: ReturnType<typeof useReaderBookmarks>,
  t: TFunction,
  locale: string,
): ReactNode[] {
  const { now, groups, saveCurrent, jump, edit } = state;
  const subheaderSx = { lineHeight: '32px', bgcolor: 'transparent', pl: inMenu ? 2 : 4 };

  function bookmarkRow(bookmark: Bookmark) {
    const isNamed = bookmark.name !== undefined;
    return (
      <Row
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
      </Row>
    );
  }

  const rows: ReactNode[] = [
    <Row key="save" inMenu={inMenu} testId="bookmark-save" onClick={saveCurrent}>
      <ListItemIcon sx={{ color: 'primary.main' }}>
        <BookmarkAddOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={t('bookmarks.save')}
        slotProps={{ primary: { sx: { color: 'primary.main', fontWeight: 600 } } }}
      />
    </Row>,
    <Divider key="save-divider" />,
  ];

  if (groups.named.length === 0 && groups.recent.length === 0) {
    rows.push(
      <Row key="empty" inMenu={inMenu} testId="bookmark-empty" disabled>
        <ListItemText primary={t('bookmarks.empty')} />
      </Row>,
    );
    return rows;
  }
  if (groups.named.length > 0) {
    rows.push(
      <ListSubheader key="named" disableSticky sx={subheaderSx}>
        {t('bookmarks.named')}
      </ListSubheader>,
      ...groups.named.map(bookmarkRow),
    );
  }
  if (groups.recent.length > 0) {
    rows.push(
      <ListSubheader key="recent" disableSticky sx={subheaderSx}>
        {t('bookmarks.recent')}
      </ListSubheader>,
      ...groups.recent.map(bookmarkRow),
    );
  }
  return rows;
}

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

function BookmarkEditDialog({
  bookmark,
  onClose,
  onNotice,
}: {
  bookmark: Bookmark;
  onClose: () => void;
  onNotice: ReaderBookmarksProps['onNotice'];
}) {
  const { t } = useTranslation();
  const rename = useBookmarksStore((s) => s.rename);
  const remove = useBookmarksStore((s) => s.remove);
  const [name, setName] = useState(bookmark.name ?? '');

  function update(action: () => void, successKey: string) {
    try {
      action();
      onNotice('success', t(successKey));
      onClose();
    } catch (err) {
      onNotice('error', translateError(err, 'bookmarks.updateFailed'));
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    update(() => rename(bookmark.id, name), 'bookmarks.renamed');
  }

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      data-testid="bookmark-rename-dialog"
      slotProps={{ paper: { component: 'form', onSubmit: submit } }}
    >
      <DialogTitle>{t('bookmarks.renameTitle')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={t('bookmarks.nameLabel')}
          helperText={bookmark.name === undefined ? t('bookmarks.renameHint') : undefined}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          slotProps={{ htmlInput: { 'data-testid': 'bookmark-rename-input' } }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          data-testid="bookmark-delete"
          sx={{ mr: 'auto' }}
          onClick={() => update(() => remove(bookmark.id), 'bookmarks.deleted')}
        >
          {t('bookmarks.delete')}
        </Button>
        <Button onClick={onClose}>{t('settings.cancel')}</Button>
        <Button
          type="submit"
          variant="contained"
          data-testid="bookmark-rename-confirm"
          disabled={!name.trim()}
        >
          {t('bookmarks.rename')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
