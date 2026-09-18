import type { SvgIconComponent } from '@mui/icons-material'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

const FEATURES: {
  icon: SvgIconComponent
  titleKey: string
  descriptionKey: string
}[] = [
  {
    icon: AutoStoriesOutlinedIcon,
    titleKey: 'home.features.formats.title',
    descriptionKey: 'home.features.formats.description',
  },
  {
    icon: DownloadOutlinedIcon,
    titleKey: 'home.features.local.title',
    descriptionKey: 'home.features.local.description',
  },
  {
    icon: CloudOffOutlinedIcon,
    titleKey: 'home.features.offline.title',
    descriptionKey: 'home.features.offline.description',
  },
]

export function HomePage() {
  const { t } = useTranslation()

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          tdbook
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          {t('home.tagline')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('home.catalogHint')}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 8 }}>
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <Grid key={feature.titleKey} size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Icon color="primary" sx={{ fontSize: 36 }} />
                <Typography variant="subtitle1">{t(feature.titleKey)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(feature.descriptionKey)}
                </Typography>
              </Box>
            </Grid>
          )
        })}
      </Grid>

      <Button component={Link} to="/books" variant="contained" color="primary">
        {t('home.browseBooks')}
      </Button>
    </Container>
  )
}
