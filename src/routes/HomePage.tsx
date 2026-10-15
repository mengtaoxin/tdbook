import type { SvgIconComponent } from '@mui/icons-material';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import WifiOffOutlinedIcon from '@mui/icons-material/WifiOffOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ConfigJsonSample } from '@/components/ConfigJsonSample';

const FEATURES: {
  icon: SvgIconComponent;
  titleKey: string;
  descriptionKey: string;
}[] = [
  {
    icon: CloudOffOutlinedIcon,
    titleKey: 'home.features.noServer.title',
    descriptionKey: 'home.features.noServer.description',
  },
  {
    icon: LockPersonOutlinedIcon,
    titleKey: 'home.features.yourData.title',
    descriptionKey: 'home.features.yourData.description',
  },
  {
    icon: WifiOffOutlinedIcon,
    titleKey: 'home.features.offline.title',
    descriptionKey: 'home.features.offline.description',
  },
];

export function HomePage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, sm: 8 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" component="p" color="primary" sx={{ fontWeight: 600 }}>
          {t('home.eyebrow')}
        </Typography>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
        >
          {t('home.headline')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '62ch' }}>
          {t('home.lead')}
        </Typography>
      </Box>

      <ConfigJsonSample />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4, mb: 8 }}>
        <Button component={Link} to="/books" variant="contained" color="primary" size="large">
          {t('home.browseBooks')}
        </Button>
        <Button component={Link} to="/config-guide" variant="outlined" size="large">
          {t('home.writeConfig')}
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Grid key={feature.titleKey} size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Icon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                  {t(feature.titleKey)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(feature.descriptionKey)}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
