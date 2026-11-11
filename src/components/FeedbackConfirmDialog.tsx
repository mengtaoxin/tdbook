import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { GITHUB_ISSUES_URL } from '@/lib/projectLinks';

export function FeedbackConfirmDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();

  function confirmFeedback() {
    onClose();
    window.open(GITHUB_ISSUES_URL, '_blank', 'noopener,noreferrer');
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      data-testid="nav-feedback-confirm"
    >
      <DialogTitle>{t('nav.feedbackConfirmTitle')}</DialogTitle>
      <DialogContent>
        <Typography>{t('nav.feedbackConfirmBody')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('settings.cancel')}</Button>
        <Button variant="contained" data-testid="nav-feedback-confirm-ok" onClick={confirmFeedback}>
          {t('settings.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
