import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateError } from '@/i18n';
import type { Bookmark } from '@/lib/bookmarks';
import { useBookmarksStore } from '@/stores/bookmarksStore';
import type { BookmarkNoticeType } from './readerBookmarksTypes';

export function BookmarkEditDialog({
  bookmark,
  currentPosition,
  onClose,
  onNotice,
}: {
  bookmark: Bookmark;
  currentPosition: () => { page: number; location: string };
  onClose: () => void;
  onNotice: (type: BookmarkNoticeType, message: string) => void;
}) {
  const { t } = useTranslation();
  const rename = useBookmarksStore((s) => s.rename);
  const updatePosition = useBookmarksStore((s) => s.update);
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

  function moveToCurrentPosition() {
    update(() => updatePosition(bookmark.id, currentPosition()), 'bookmarks.updated');
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
        <Typography variant="subtitle2" component="h3" sx={{ mt: 2 }}>
          {t('bookmarks.positionTitle')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          data-testid="bookmark-update-hint"
          sx={{ mt: 0.5 }}
        >
          {t('bookmarks.updatePositionHint', { page: bookmark.page })}
        </Typography>
        <Button
          type="button"
          variant="outlined"
          size="small"
          sx={{ mt: 1 }}
          data-testid="bookmark-update-position"
          onClick={moveToCurrentPosition}
        >
          {t('bookmarks.updatePosition')}
        </Button>
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
