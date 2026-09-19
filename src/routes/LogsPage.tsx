import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { TdLog, type TdLogRecord } from 'tdkit'

export function LogsPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<TdLogRecord[]>([])
  const [clearing, setClearing] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  async function refresh() {
    const page = await TdLog.query({ page: 1, pageSize: 100 })
    setLogs(page.records)
  }

  async function confirmClearLogs() {
    setConfirmClearOpen(false)
    setClearing(true)
    try {
      await TdLog.clean()
      setLogs([])
    } finally {
      setClearing(false)
    }
  }

  function formatTime(createdAt: number) {
    return new Date(createdAt).toLocaleString()
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <Container maxWidth="md" sx={{ py: 8 }} data-testid="logs-page">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          gap: 1.5,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ m: 0 }}>
          {t('nav.logs')}
        </Typography>
        <Button
          data-testid="logs-clear"
          color="error"
          variant="outlined"
          loading={clearing}
          disabled={logs.length === 0}
          onClick={() => setConfirmClearOpen(true)}
        >
          {t('logs.clear')}
        </Button>
      </Box>

      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('logs.clear')}</DialogTitle>
        <DialogContent>{t('logs.clearConfirm')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>
            {t('settings.cancel')}
          </Button>
          <Button
            color="error"
            variant="outlined"
            onClick={() => void confirmClearLogs()}
          >
            {t('settings.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {logs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('logs.empty')}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {logs.map((entry) => (
            <Box
              component="li"
              key={entry.id}
              data-testid="log-entry"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                typography: 'body2',
              }}
            >
              <Box
                component="time"
                dateTime={new Date(entry.createdAt).toISOString()}
                sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTime(entry.createdAt)}
              </Box>
              <Box
                component="span"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {entry.message}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Container>
  )
}
