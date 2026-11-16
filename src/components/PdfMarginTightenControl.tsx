import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateError } from '@/i18n';
import {
  PDF_MARGIN_TIGHTEN_DEFAULT,
  PDF_MARGIN_TIGHTEN_MAX,
  PDF_MARGIN_TIGHTEN_MIN,
} from '@/lib/pdfMarginTighten';
import { getPdfMarginTightenForBook } from '@/lib/pdfMarginTightenStorage';
import { usePdfMarginTightenStore } from '@/stores/pdfMarginTightenStore';

type PdfMarginTightenControlProps = {
  bookId: string;
};

export function PdfMarginTightenControl({ bookId }: PdfMarginTightenControlProps) {
  const { t } = useTranslation();
  const tighten = usePdfMarginTightenStore((state) =>
    getPdfMarginTightenForBook(state.byBookId, bookId),
  );
  const setTighten = usePdfMarginTightenStore((state) => state.set);
  const [error, setError] = useState('');

  const percent = Math.round(tighten * 100);

  function handleChange(_event: Event, value: number | number[]) {
    const next = Array.isArray(value) ? (value[0] ?? PDF_MARGIN_TIGHTEN_DEFAULT) : value;
    try {
      setTighten(bookId, next / 100);
      setError('');
    } catch (err) {
      setError(translateError(err, 'errors.localStorageWrite'));
    }
  }

  return (
    <Box sx={{ mx: 'auto', mt: 2, maxWidth: 900, px: 1 }}>
      <Typography id="pdf-margin-tighten-label" variant="body2" color="text.secondary" gutterBottom>
        {t('reader.marginTighten', { percent })}
      </Typography>
      <Slider
        aria-labelledby="pdf-margin-tighten-label"
        aria-label={t('reader.marginTightenAria')}
        min={PDF_MARGIN_TIGHTEN_MIN * 100}
        max={PDF_MARGIN_TIGHTEN_MAX * 100}
        step={1}
        value={percent}
        onChange={handleChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `${v}%`}
      />
      {error ? (
        <Typography variant="caption" color="error" role="alert">
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
