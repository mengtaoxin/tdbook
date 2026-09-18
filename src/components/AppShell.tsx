import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import MenuIcon from '@mui/icons-material/Menu'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TranslateIcon from '@mui/icons-material/Translate'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppLocale } from '@/lib/locale'
import { SUPPORTED_LOCALES } from '@/lib/locale'
import { shouldCollapseNav } from '@/lib/navLayout'
import { useLocaleStore } from '@/stores/localeStore'

const NAV_ITEMS = [
  { labelKey: 'nav.books', to: '/books' as const, Icon: AutoStoriesOutlinedIcon },
  { labelKey: 'nav.settings', to: '/settings' as const, Icon: SettingsOutlinedIcon },
  {
    labelKey: 'nav.configGuide',
    to: '/config-guide' as const,
    Icon: DescriptionOutlinedIcon,
  },
  { labelKey: 'nav.about', to: '/about' as const, Icon: InfoOutlinedIcon },
]

export function AppShell() {
  const { t } = useTranslation()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [localeAnchor, setLocaleAnchor] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [compactNav, setCompactNav] = useState(true)
  const [drawerLocaleOpen, setDrawerLocaleOpen] = useState(false)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const brandRef = useRef<HTMLAnchorElement | null>(null)
  const desktopNavRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current
    const brand = brandRef.current
    const nav = desktopNavRef.current
    if (!toolbar || !brand || !nav) return

    function updateCompactNav() {
      if (!toolbar || !brand || !nav) return
      const availableWidth = toolbar.clientWidth - brand.offsetWidth
      setCompactNav(shouldCollapseNav(nav.scrollWidth, availableWidth))
    }

    updateCompactNav()
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      updateCompactNav()
    })
    observer.observe(toolbar)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [locale, t])

  function chooseLocale(code: AppLocale) {
    setLocale(code)
    setLocaleAnchor(null)
    setDrawerOpen(false)
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
      <Button
        color="inherit"
        startIcon={<TranslateIcon />}
        data-testid="nav-locale-toggle"
        aria-label={t('locale.label')}
        tabIndex={compactNav ? -1 : undefined}
        onClick={(event) => setLocaleAnchor(event.currentTarget)}
      >
        {t(`locale.${locale}`)}
      </Button>
    </Box>
  )

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
            <ListItemButton
              onClick={() => setDrawerLocaleOpen((open) => !open)}
            >
              <ListItemIcon>
                <TranslateIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.language')} />
            </ListItemButton>
            <Collapse in={drawerLocaleOpen} timeout="auto" unmountOnExit>
              <List dense disablePadding>
                {SUPPORTED_LOCALES.map((code) => (
                  <ListItemButton
                    key={code}
                    data-testid={`locale-option-${code}`}
                    selected={locale === code}
                    sx={{ pl: 4 }}
                    onClick={() => chooseLocale(code)}
                  >
                    <ListItemIcon>
                      <TranslateIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t(`locale.${code}`)} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </List>
          <Divider />
        </Box>
      </Drawer>

      <AppBar position="sticky" elevation={1}>
        <Toolbar
          ref={toolbarRef}
          sx={{ gap: 1, position: 'relative', overflow: 'hidden' }}
        >
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
        anchorEl={localeAnchor}
        open={Boolean(localeAnchor)}
        onClose={() => setLocaleAnchor(null)}
        data-testid="nav-locale-menu"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <MenuItem
            key={code}
            data-testid={`locale-option-${code}`}
            selected={locale === code}
            onClick={() => chooseLocale(code)}
          >
            {t(`locale.${code}`)}
          </MenuItem>
        ))}
      </Menu>

      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
