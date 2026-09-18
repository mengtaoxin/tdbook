import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { AboutPage } from '@/routes/AboutPage'
import { BookReaderPage } from '@/routes/BookReaderPage'
import { BooksPage } from '@/routes/BooksPage'
import { ConfigGuidePage } from '@/routes/ConfigGuidePage'
import { HomePage } from '@/routes/HomePage'
import { SettingsPage } from '@/routes/SettingsPage'

function parsePageSearch(search: Record<string, unknown>): { page: number } {
  const raw = search.page
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value == null || value === '') {
    return { page: 1 }
  }
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseInt(String(value), 10)
  return { page: Number.isFinite(parsed) && parsed >= 1 ? parsed : 1 }
}

const rootRoute = createRootRoute({
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const booksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/books',
  component: BooksPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const configGuideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/config-guide',
  component: ConfigGuidePage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
})

const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/book/$id',
  validateSearch: parsePageSearch,
  component: BookReaderPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  booksRoute,
  settingsRoute,
  configGuideRoute,
  aboutRoute,
  bookRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
