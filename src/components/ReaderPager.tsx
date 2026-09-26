import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

type ReaderPagerProps = {
  page: number;
  totalPages: number;
  prevPage: number | null;
  nextPage: number | null;
  wide?: boolean;
  onGo: (target: number) => void;
};

export function ReaderPager({
  page,
  totalPages,
  prevPage,
  nextPage,
  wide = false,
  onGo,
}: ReaderPagerProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mx: 'auto',
        mt: 2,
        maxWidth: wide ? 900 : 720,
      }}
    >
      <IconButton
        color="primary"
        size="large"
        disabled={prevPage == null}
        aria-label={t('reader.prevPage')}
        onClick={() => prevPage != null && onGo(prevPage)}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="body2" color="text.secondary">
        {t('reader.pageOf', { page, total: totalPages })}
      </Typography>
      <IconButton
        color="primary"
        size="large"
        disabled={nextPage == null}
        aria-label={t('reader.nextPage')}
        onClick={() => nextPage != null && onGo(nextPage)}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}
