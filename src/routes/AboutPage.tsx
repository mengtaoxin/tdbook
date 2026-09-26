import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { PROJECT_URL } from '@/lib/projectLinks';

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        {t('about.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('about.body')}
      </Typography>
      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        {t('about.projectUrl')}
      </Typography>
      <Link href={PROJECT_URL} target="_blank" rel="noopener noreferrer">
        {PROJECT_URL}
      </Link>
    </Container>
  );
}
