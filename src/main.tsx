import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { registerSW } from 'virtual:pwa-register';
import { ChunkErrorBoundary } from '@/components/ChunkErrorBoundary';
import { registerSpaUpdateNotice } from '@/lib/spaUpdateNotice';
import i18n from './i18n';
import { router } from './router';
import { theme } from './theme';
import './style.css';

// Production-only: vite-plugin-pwa leaves registration a no-op in `npm run dev`.
registerSW({ immediate: true });

// Stale hashed chunks after deploy → hosted spa-update-notice (reload once, then UI).
void registerSpaUpdateNotice();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <ChunkErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <RouterProvider router={router} />
        </ThemeProvider>
      </I18nextProvider>
    </ChunkErrorBoundary>
  </StrictMode>,
);
