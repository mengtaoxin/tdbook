import CachedIcon from '@mui/icons-material/Cached';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateError } from '@/i18n';
import { clearAllBookCaches } from '@/lib/bookCache';
import { clearPersistedBookConfigs, invalidateBookConfigsCache } from '@/lib/catalog';
import { DEFAULT_CONFIGS_URL } from '@/lib/settings';
import { useBooksStore } from '@/stores/booksStore';
import { useSettingsStore } from '@/stores/settingsStore';

type ClearTarget = 'catalog' | 'books' | null;

export function SettingsPage() {
  const { t } = useTranslation();
  const configsUrl = useSettingsStore((s) => s.configsUrl);
  const setConfigsUrl = useSettingsStore((s) => s.setConfigsUrl);
  const restoreDefault = useSettingsStore((s) => s.restoreDefault);
  const [draft, setDraft] = useState(configsUrl);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [clearTarget, setClearTarget] = useState<ClearTarget>(null);
  const [clearing, setClearing] = useState(false);

  function showMessage(text: string, type: 'success' | 'error') {
    setMessage(text);
    setMessageType(type);
  }

  function save() {
    try {
      setConfigsUrl(draft);
      const stored = useSettingsStore.getState().configsUrl;
      setDraft(stored);
      showMessage(
        stored ? t('settings.saved') : t('settings.usingDefault', { url: DEFAULT_CONFIGS_URL }),
        'success',
      );
    } catch (err) {
      showMessage(translateError(err, 'settings.saveFailed'), 'error');
    }
  }

  function onRestoreDefault() {
    try {
      restoreDefault();
      setDraft('');
      showMessage(t('settings.restoredDefault', { url: DEFAULT_CONFIGS_URL }), 'success');
    } catch (err) {
      showMessage(translateError(err, 'settings.restoreFailed'), 'error');
    }
  }

  function closeClearConfirm() {
    if (clearing) return;
    setClearTarget(null);
  }

  async function confirmClearCache() {
    if (clearing || !clearTarget) return;
    setClearing(true);
    try {
      if (clearTarget === 'catalog') {
        clearPersistedBookConfigs();
        invalidateBookConfigsCache();
        useBooksStore.getState().invalidate();
        setClearTarget(null);
        showMessage(t('settings.catalogCacheCleared'), 'success');
      } else {
        await clearAllBookCaches();
        useBooksStore.getState().invalidate();
        setClearTarget(null);
        showMessage(t('settings.cacheCleared'), 'success');
      }
    } catch {
      showMessage(
        clearTarget === 'catalog'
          ? t('settings.clearCatalogCacheFailed')
          : t('settings.clearCacheFailed'),
        'error',
      );
    } finally {
      setClearing(false);
    }
  }

  const confirmTitle =
    clearTarget === 'catalog'
      ? t('settings.clearCatalogCacheConfirmTitle')
      : t('settings.clearCacheConfirmTitle');
  const confirmBody =
    clearTarget === 'catalog'
      ? t('settings.clearCatalogCacheConfirmBody')
      : t('settings.clearCacheConfirmBody');

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
          {t('settings.title')}
        </Typography>

        {message ? (
          <Alert severity={messageType} onClose={() => setMessage('')} sx={{ mb: 2 }}>
            {message}
          </Alert>
        ) : null}

        <TextField
          fullWidth
          label={t('settings.configsUrlLabel')}
          placeholder={DEFAULT_CONFIGS_URL}
          helperText={t('settings.configsUrlHint')}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="off"
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/config-guide">
            {t('settings.viewConfigGuide')}
          </Link>
        </Typography>

        <Stack direction="row" spacing={1.5} useFlexGap sx={{ mb: 5, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={save}>
            {t('settings.save')}
          </Button>
          <Button variant="outlined" onClick={onRestoreDefault}>
            {t('settings.restoreDefault')}
          </Button>
        </Stack>

        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          {t('settings.cacheTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t('settings.catalogCacheDescription')}
        </Typography>
        <Button
          color="error"
          variant="outlined"
          startIcon={<Inventory2OutlinedIcon />}
          onClick={() => setClearTarget('catalog')}
          sx={{ mb: 3 }}
        >
          {t('settings.clearCatalogCache')}
        </Button>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t('settings.cacheDescription')}
        </Typography>
        <Button
          color="error"
          variant="outlined"
          startIcon={<CachedIcon />}
          onClick={() => setClearTarget('books')}
        >
          {t('settings.clearCache')}
        </Button>
      </Container>

      <Dialog open={clearTarget !== null} onClose={closeClearConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography>{confirmBody}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeClearConfirm} disabled={clearing}>
            {t('settings.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            loading={clearing}
            onClick={() => void confirmClearCache()}
          >
            {t('settings.clear')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
