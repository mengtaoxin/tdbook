import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { alpha } from '@mui/material/styles';
import { Link } from '@tanstack/react-router';
import { type RefObject, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type BookmarkNoticeType, ReaderBookmarksList } from './ReaderBookmarks';
import { MORE_NAV_ITEMS, NAV_ITEMS } from './navItems';

export function AppNav({
  bookId,
  pathname,
  compactNav,
  desktopNavRef,
  bookmarkAnchor,
  onBookmarkAnchor,
  onBookmarkDone,
  onBookmarkNotice,
  onOpenFeedback,
}: {
  bookId: string | null;
  pathname: string;
  compactNav: boolean;
  desktopNavRef: RefObject<HTMLElement | null>;
  bookmarkAnchor: HTMLElement | null;
  onBookmarkAnchor: (el: HTMLElement | null) => void;
  onBookmarkDone: () => void;
  onBookmarkNotice: (type: BookmarkNoticeType, message: string) => void;
  onOpenFeedback: () => void;
}) {
  const { t } = useTranslation();
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMoreOpen, setDrawerMoreOpen] = useState(false);
  const [drawerBookmarksOpen, setDrawerBookmarksOpen] = useState(true);
  const [drawerPathname, setDrawerPathname] = useState(pathname);
  if (drawerPathname !== pathname) {
    setDrawerPathname(pathname);
    setDrawerOpen(false);
  }

  function openFeedbackConfirm() {
    setMoreAnchor(null);
    setDrawerOpen(false);
    onOpenFeedback();
  }

  function closeBookmarks() {
    onBookmarkDone();
    setDrawerOpen(false);
  }

  return (
    <>
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
                    onNotice={onBookmarkNotice}
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
        {bookId ? (
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<BookmarkBorderOutlinedIcon />}
            data-testid="nav-bookmarks"
            aria-haspopup="menu"
            aria-expanded={bookmarkAnchor ? true : undefined}
            tabIndex={compactNav ? -1 : undefined}
            onClick={(event) => onBookmarkAnchor(event.currentTarget)}
            sx={(theme) => ({
              // Reader-only control: extra inset stays on the left so Books and More stay packed.
              ml: 1,
              mr: 0,
              px: 1.25,
              borderColor: alpha(theme.palette.primary.contrastText, bookmarkAnchor ? 0.92 : 0.55),
              backgroundColor: alpha(
                theme.palette.primary.contrastText,
                bookmarkAnchor ? 0.22 : 0.1,
              ),
              '&:hover': {
                borderColor: alpha(theme.palette.primary.contrastText, 0.92),
                backgroundColor: alpha(theme.palette.primary.contrastText, 0.2),
              },
            })}
          >
            {t('nav.bookmarks')}
          </Button>
        ) : null}
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
    </>
  );
}
