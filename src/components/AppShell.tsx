import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompactNav } from '@/hooks/useCompactNav';
import { readerBookIdFromPath } from '@/lib/bookmarks';
import { routeBreadcrumbKeys } from '@/lib/navBreadcrumb';
import { useLocaleStore } from '@/stores/localeStore';
import { AppNav } from './AppNav';
import { FeedbackConfirmDialog } from './FeedbackConfirmDialog';
import { type BookmarkNoticeType, ReaderBookmarksMenu } from './ReaderBookmarks';

export function AppShell() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bookId = readerBookIdFromPath(pathname);
  const breadcrumbKeys = routeBreadcrumbKeys(pathname);
  const { compactNav, toolbarRef, leftClusterRef, desktopNavRef } = useCompactNav({
    locale,
    t,
    bookId,
    pathname,
  });
  const [bookmarkAnchor, setBookmarkAnchor] = useState<null | HTMLElement>(null);
  const [bookmarkNotice, setBookmarkNotice] = useState('');
  const [bookmarkNoticeType, setBookmarkNoticeType] = useState<BookmarkNoticeType>('success');
  const [feedbackConfirmOpen, setFeedbackConfirmOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!window.location.hash) {
      document.querySelector('main.reader-scroll')?.scrollTo(0, 0);
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- scroll to top on every route change
  }, [pathname]);

  function closeBookmarks() {
    setBookmarkAnchor(null);
  }

  function showBookmarkNotice(type: BookmarkNoticeType, message: string) {
    setBookmarkNoticeType(type);
    setBookmarkNotice(message);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        ...(bookId ? { height: '100vh', overflow: 'hidden' } : null),
      }}
    >
      <AppBar position="sticky" elevation={1}>
        <Toolbar ref={toolbarRef} sx={{ gap: 1, position: 'relative', overflow: 'hidden' }}>
          <Box
            ref={leftClusterRef}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              // Keep the cluster from shrinking so desktop nav overflows and
              // useCompactNav can collapse into the hamburger.
              flexShrink: 0,
              mr: 1,
            }}
          >
            <Typography
              component={Link}
              to="/"
              data-testid="brand-title"
              aria-label={t('nav.home')}
              variant="h6"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                color: 'inherit',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <MenuBookRoundedIcon />
              tdbook
              <Chip
                data-testid="brand-beta"
                label={t('nav.beta')}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'inherit',
                  borderColor: 'currentColor',
                  opacity: 0.85,
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            </Typography>

            {breadcrumbKeys.length > 0 ? (
              <Breadcrumbs
                aria-label={t('nav.breadcrumb')}
                data-testid="nav-breadcrumb"
                sx={{
                  color: 'inherit',
                  minWidth: 0,
                  overflow: 'hidden',
                  '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' },
                  '& .MuiBreadcrumbs-li': { minWidth: 0 },
                  '& .MuiBreadcrumbs-separator': { mx: 0.75, opacity: 0.7 },
                }}
              >
                {breadcrumbKeys.map((key, index) => {
                  const isCurrent = index === breadcrumbKeys.length - 1;
                  return (
                    <Typography
                      key={key}
                      component="span"
                      variant="body2"
                      color="inherit"
                      aria-current={isCurrent ? 'page' : undefined}
                      sx={{
                        opacity: isCurrent ? 1 : 0.75,
                        fontWeight: isCurrent ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t(key)}
                    </Typography>
                  );
                })}
              </Breadcrumbs>
            ) : null}
          </Box>

          <AppNav
            bookId={bookId}
            pathname={pathname}
            compactNav={compactNav}
            desktopNavRef={desktopNavRef}
            bookmarkAnchor={bookmarkAnchor}
            onBookmarkAnchor={setBookmarkAnchor}
            onBookmarkDone={closeBookmarks}
            onBookmarkNotice={showBookmarkNotice}
            onOpenFeedback={() => setFeedbackConfirmOpen(true)}
          />
        </Toolbar>
      </AppBar>

      {bookId ? (
        <ReaderBookmarksMenu
          anchorEl={bookmarkAnchor}
          bookId={bookId}
          onDone={closeBookmarks}
          onNotice={showBookmarkNotice}
        />
      ) : null}

      <Snackbar
        open={Boolean(bookmarkNotice)}
        autoHideDuration={4000}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') setBookmarkNotice('');
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={bookmarkNoticeType} variant="filled" onClose={() => setBookmarkNotice('')}>
          {bookmarkNotice}
        </Alert>
      </Snackbar>

      <FeedbackConfirmDialog
        open={feedbackConfirmOpen}
        onClose={() => setFeedbackConfirmOpen(false)}
      />

      <Box
        component="main"
        className={bookId ? 'reader-scroll' : undefined}
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          ...(bookId ? { overflowY: 'auto' } : null),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
