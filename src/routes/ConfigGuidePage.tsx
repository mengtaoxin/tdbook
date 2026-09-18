import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  configGuideMarkdownUrl,
  renderMarkdown,
} from '@/lib/configGuideMarkdown'
import { useLocaleStore } from '@/stores/localeStore'

export function ConfigGuidePage() {
  const { t } = useTranslation()
  const locale = useLocaleStore((s) => s.locale)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadGuide() {
      setLoading(true)
      setLoadError(false)
      setHtml('')
      try {
        const response = await fetch(configGuideMarkdownUrl(locale))
        if (!response.ok) {
          if (!cancelled) setLoadError(true)
          return
        }
        const source = await response.text()
        if (!cancelled) setHtml(renderMarkdown(source))
      } catch {
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadGuide()
    return () => {
      cancelled = true
    }
  }, [locale])

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      {loading ? (
        <Typography variant="body2" color="text.secondary">
          {t('configGuide.loading')}
        </Typography>
      ) : null}
      {loadError ? (
        <Alert severity="error">{t('configGuide.loadError')}</Alert>
      ) : null}
      {!loading && !loadError ? (
        <Box
          className="guide-md"
          dangerouslySetInnerHTML={{ __html: html }}
          sx={{
            '& h1': {
              fontSize: '1.25rem',
              fontWeight: 500,
              lineHeight: 1.5,
              m: '0 0 1rem',
            },
            '& h2': {
              fontSize: '1rem',
              fontWeight: 500,
              lineHeight: 1.5,
              mt: 3,
              mb: 1,
            },
            '& p': {
              m: '0 0 0.75rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            },
            '& ol, & ul': {
              m: '0 0 0.75rem',
              pl: 2.5,
              fontSize: '0.875rem',
              lineHeight: 1.5,
            },
            '& li': { mb: 0.5 },
            '& code': {
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85em',
            },
            '& pre': {
              m: '0 0 0.75rem',
              overflowX: 'auto',
              p: '0.75rem 1rem',
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontSize: '0.8125rem',
              lineHeight: 1.55,
            },
            '& pre code': {
              fontSize: 'inherit',
              whiteSpace: 'pre-wrap',
            },
            '& a': {
              color: 'primary.main',
            },
          }}
        />
      ) : null}
    </Container>
  )
}
