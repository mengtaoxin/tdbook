import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readerBookIdFromPath } from '@/lib/bookmarks';
import { shouldCollapseNav, toolbarNavAvailableWidth } from '@/lib/navLayout';
import { GITHUB_ISSUES_URL } from '@/lib/projectLinks';
import { useLocaleStore } from '@/stores/localeStore';
import {
  type BookmarkNoticeType,
  ReaderBookmarksList,
  ReaderBookmarksMenu,
} from './ReaderBookmarks';

const NAV_ITEMS = [{ labelKey: 'nav.books', to: '/books' as const, Icon: AutoStoriesOutlinedIcon }];

const MORE_NAV_ITEMS = [
  { labelKey: 'nav.logs', to: '/logs' as const, Icon: NotesOutlinedIcon },
  { labelKey: 'nav.settings', to: '/settings' as const, Icon: SettingsOutlinedIcon },
  {
    labelKey: 'nav.configGuide',
    to: '/config-guide' as const,
    Icon: DescriptionOutlinedIcon,
  },
  { labelKey: 'nav.about', to: '/about' as const, Icon: InfoOutlinedIcon },
];

export function AppShell() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bookId = readerBookIdFromPath(pathname);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const [bookmarkAnchor, setBookmarkAnchor] = useState<null | HTMLElement>(null);
  const [bookmarkNotice, setBookmarkNotice] = useState('');
  const [bookmarkNoticeType, setBookmarkNoticeType] = useState<BookmarkNoticeType>('success');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compactNav, setCompactNav] = useState(true);
  const [drawerMoreOpen, setDrawerMoreOpen] = useState(false);
  const [drawerBookmarksOpen, setDrawerBookmarksOpen] = useState(true);
  const [feedbackConfirmOpen, setFeedbackConfirmOpen] = useState(false);
  const [drawerPathname, setDrawerPathname] = useState(pathname);
  if (drawerPathname !== pathname) {
    setDrawerPathname(pathname);
    setDrawerOpen(false);
  }
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLAnchorElement | null>(null);
  const desktopNavRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- scroll to top on every route change
  }, [pathname]);

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    const brand = brandRef.current;
    const nav = desktopNavRef.current;
    if (!toolbar || !brand || !nav) return;

    function updateCompactNav() {
      if (!toolbar || !brand || !nav) return;
      const toolbarStyle = getComputedStyle(toolbar);
      const brandStyle = getComputedStyle(brand);
      const availableWidth = toolbarNavAvailableWidth({
        toolbarClientWidth: toolbar.clientWidth,
        toolbarPaddingLeft: parseFloat(toolbarStyle.paddingLeft) || 0,
        toolbarPaddingRight: parseFloat(toolbarStyle.paddingRight) || 0,
        toolbarGap: parseFloat(toolbarStyle.columnGap || toolbarStyle.gap) || 0,
        brandWidth: brand.offsetWidth,
        brandMarginEnd: parseFloat(brandStyle.marginInlineEnd || brandStyle.marginRight) || 0,
      });
      setCompactNav(shouldCollapseNav(nav.scrollWidth, availableWidth));
    }

    updateCompactNav();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      updateCompactNav();
    });
    observer.observe(toolbar);
    observer.observe(nav);
    return () => observer.disconnect();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- nav labels and the bookmarks button change its width
  }, [locale, t, bookId]);

  function openFeedbackConfirm() {
    setMoreAnchor(null);
    setDrawerOpen(false);
    setFeedbackConfirmOpen(true);
  }

  function closeFeedbackConfirm() {
    setFeedbackConfirmOpen(false);
  }

  function confirmFeedback() {
    setFeedbackConfirmOpen(false);
    window.open(GITHUB_ISSUES_URL, '_blank', 'noopener,noreferrer');
  }

  function closeBookmarks() {
    setBookmarkAnchor(null);
    setDrawerOpen(false);
  }

  function showBookmarkNotice(type: BookmarkNoticeType, message: string) {
    setBookmarkNoticeType(type);
    setBookmarkNotice(message);
  }

  const desktopNav = (
    <Box
      component="nav"
      ref={desktopNavRef}
      data-testid="desktop-nav"
      aria-hidden={compactNav || undefined}
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 0.5,
        whiteSpace: 'nowrap',
        ...(compactNav
          ? {
              position: 'absolute',
              visibility: 'hidden',
              pointerEvents: 'none',
            }
          : {}),
      }}
    >
      {NAV_ITEMS.map((item) => (
        <Button
          key={item.to}
          component={Link}
          to={item.to}
          color="inherit"
          startIcon={<item.Icon />}
          tabIndex={compactNav ? -1 : undefined}
          sx={{ opacity: pathname === item.to ? 1 : 0.85 }}
        >
          {t(item.labelKey)}
        </Button>
      ))}
      {bookId ? (
        <Button
          color="inherit"
          startIcon={<BookmarkBorderOutlinedIcon />}
          data-testid="nav-bookmarks"
          tabIndex={compactNav ? -1 : undefined}
          onClick={(event) => setBookmarkAnchor(event.currentTarget)}
        >
          {t('nav.bookmarks')}
        </Button>
      ) : null}
      <Button
        color="inherit"
        startIcon={<MoreHorizOutlinedIcon />}
        data-testid="nav-more-toggle"
        aria-label={t('nav.more')}
        tabIndex={compactNav ? -1 : undefined}
        onClick={(event) => setMoreAnchor(event.currentTarget)}
        sx={{
          opacity: MORE_NAV_ITEMS.some((item) => pathname === item.to) ? 1 : 0.85,
        }}
      >
        {t('nav.more')}
      </Button>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data-testid="nav-drawer"
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ width: 280 }} role="presentation">
          <List dense>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.to}
                component={Link}
                to={item.to}
                selected={pathname === item.to}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemIcon>
                  <item.Icon />
                </ListItemIcon>
                <ListItemText primary={t(item.labelKey)} />
              </ListItemButton>
            ))}
            {bookId ? (
              <>
                <ListItemButton
                  data-testid="drawer-bookmarks"
                  onClick={() => setDrawerBookmarksOpen((open) => !open)}
                >
                  <ListItemIcon>
                    <BookmarkBorderOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('nav.bookmarks')} />
                </ListItemButton>
                <Collapse in={drawerBookmarksOpen} timeout="auto" unmountOnExit>
                  <ReaderBookmarksList
                    bookId={bookId}
                    onDone={closeBookmarks}
                    onNotice={showBookmarkNotice}
                  />
                </Collapse>
              </>
            ) : null}
            <ListItemButton
              data-testid="nav-drawer-more-toggle"
              onClick={() => setDrawerMoreOpen((open) => !open)}
            >
              <ListItemIcon>
                <MoreHorizOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.more')} />
            </ListItemButton>
            <Collapse in={drawerMoreOpen} timeout="auto" unmountOnExit>
              <List dense disablePadding>
                {MORE_NAV_ITEMS.map((item) => (
                  <ListItemButton
                    key={item.to}
                    component={Link}
                    to={item.to}
                    selected={pathname === item.to}
                    sx={{ pl: 4 }}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemIcon>
                      <item.Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t(item.labelKey)} />
                  </ListItemButton>
                ))}
                <ListItemButton
                  data-testid="nav-feedback"
                  sx={{ pl: 4 }}
                  onClick={openFeedbackConfirm}
                >
                  <ListItemIcon>
                    <FeedbackOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t('nav.feedback')} />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
          <Divider />
        </Box>
      </Drawer>

      <AppBar position="sticky" elevation={1}>
        <Toolbar ref={toolbarRef} sx={{ gap: 1, position: 'relative', overflow: 'hidden' }}>
          <Typography
            component={Link}
            ref={brandRef}
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
              mr: 1,
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

          {compactNav ? (
            <IconButton
              color="inherit"
              data-testid="nav-menu-toggle"
              aria-label={t('nav.openMenu')}
              onClick={() => setDrawerOpen((open) => !open)}
            >
              <MenuIcon />
            </IconButton>
          ) : null}

          <Box sx={{ flexGrow: 1 }} />
          {desktopNav}
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
        data-testid="nav-more-menu"
      >
        {MORE_NAV_ITEMS.map((item) => (
          <MenuItem
            key={item.to}
            component={Link}
            to={item.to}
            selected={pathname === item.to}
            onClick={() => setMoreAnchor(null)}
          >
            <ListItemIcon>
              <item.Icon fontSize="small" />
            </ListItemIcon>
            {t(item.labelKey)}
          </MenuItem>
        ))}
        <MenuItem data-testid="nav-feedback" onClick={openFeedbackConfirm}>
          <ListItemIcon>
            <FeedbackOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {t('nav.feedback')}
        </MenuItem>
      </Menu>

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

      <Dialog
        open={feedbackConfirmOpen}
        onClose={closeFeedbackConfirm}
        maxWidth="xs"
        fullWidth
        data-testid="nav-feedback-confirm"
      >
        <DialogTitle>{t('nav.feedbackConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('nav.feedbackConfirmBody')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFeedbackConfirm}>{t('settings.cancel')}</Button>
          <Button
            variant="contained"
            data-testid="nav-feedback-confirm-ok"
            onClick={confirmFeedback}
          >
            {t('settings.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
