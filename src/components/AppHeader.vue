<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { setAppLocale } from '@/i18n'
import {
  SUPPORTED_LOCALES,
  setStoredLocale,
  type AppLocale,
} from '@/lib/locale'
import { shouldCollapseNav } from '@/lib/navLayout'

const { t, locale } = useI18n()
const route = useRoute()
const drawerOpen = ref(false)
const compactNav = ref(true)

const appBarRef = ref<{ $el?: HTMLElement } | null>(null)
const desktopNavRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

type NavRouteLink = {
  to: { name: string }
  key: string
  icon: string
}
type NavLocaleLink = { locale: AppLocale; key: string; icon: string }
type NavGroup = {
  key: string
  icon: string
  children: readonly NavLocaleLink[]
  menuTestId: string
}
type NavItem = NavRouteLink | NavGroup

function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

function updateCompactNav() {
  const toolbarContent = appBarRef.value?.$el?.querySelector(
    '.v-toolbar__content',
  ) as HTMLElement | null
  const brand = toolbarContent?.querySelector('.brand') as HTMLElement | null
  const nav = desktopNavRef.value
  if (!toolbarContent || !brand || !nav) return

  const availableWidth = toolbarContent.clientWidth - brand.offsetWidth
  compactNav.value = shouldCollapseNav(nav.scrollWidth, availableWidth)
}

function observeLayout() {
  resizeObserver?.disconnect()
  resizeObserver = null

  const toolbarContent = appBarRef.value?.$el?.querySelector(
    '.v-toolbar__content',
  ) as HTMLElement | null
  if (!toolbarContent || typeof ResizeObserver === 'undefined') {
    updateCompactNav()
    return
  }

  resizeObserver = new ResizeObserver(() => {
    updateCompactNav()
  })
  resizeObserver.observe(toolbarContent)
  if (desktopNavRef.value) resizeObserver.observe(desktopNavRef.value)
  updateCompactNav()
}

watch(locale, async () => {
  await nextTick()
  updateCompactNav()
})

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

onMounted(() => {
  observeLayout()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

const localeChildren: readonly NavLocaleLink[] = SUPPORTED_LOCALES.map(
  (code) => ({
    locale: code,
    key: `locale.${code}`,
    icon: 'mdi-translate',
  }),
)

const navItems: readonly NavItem[] = [
  { to: { name: 'home' }, key: 'nav.home', icon: 'mdi-home' },
  { to: { name: 'books' }, key: 'nav.books', icon: 'mdi-bookshelf' },
  { to: { name: 'settings' }, key: 'nav.settings', icon: 'mdi-cog' },
  {
    to: { name: 'config-guide' },
    key: 'nav.configGuide',
    icon: 'mdi-file-document-outline',
  },
  { to: { name: 'about' }, key: 'nav.about', icon: 'mdi-information-outline' },
  {
    key: 'nav.language',
    icon: 'mdi-translate',
    children: localeChildren,
    menuTestId: 'nav-locale',
  },
]

function onLocaleChange(value: AppLocale) {
  try {
    setStoredLocale(value)
    setAppLocale(value)
  } catch {
    // localStorage may be unavailable; keep current locale
  }
}
</script>

<template>
  <v-navigation-drawer
    v-model="drawerOpen"
    data-testid="nav-drawer"
    temporary
    location="start"
    width="280"
    class="nav-drawer"
  >
    <v-list density="compact" nav>
      <template v-for="item in navItems" :key="item.key">
        <v-list-group v-if="isNavGroup(item)" :value="item.key">
          <template #activator="{ props: activatorProps }">
            <v-list-item
              v-bind="activatorProps"
              :title="t(item.key)"
              :prepend-icon="item.icon"
            />
          </template>
          <v-list-item
            v-for="child in item.children"
            :key="child.key"
            :data-testid="`locale-option-${child.locale}`"
            :title="t(child.key)"
            :prepend-icon="child.icon"
            :active="locale === child.locale"
            @click="
              onLocaleChange(child.locale);
              drawerOpen = false
            "
          />
        </v-list-group>
        <v-list-item
          v-else
          :to="item.to"
          :title="t(item.key)"
          :prepend-icon="item.icon"
          @click="drawerOpen = false"
        />
      </template>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar ref="appBarRef" color="primary" elevation="1">
    <v-app-bar-title class="brand flex-grow-0 flex-shrink-0">
      <RouterLink
        :to="{ name: 'home' }"
        data-testid="brand-title"
        class="brand-mark header-centerline text-inherit text-decoration-none"
      >
        <v-icon icon="mdi-book-open-page-variant" class="mr-2" />
        tdbook
      </RouterLink>
    </v-app-bar-title>

    <v-btn
      v-if="compactNav"
      data-testid="nav-menu-toggle"
      class="header-centerline"
      icon
      variant="text"
      :aria-label="t('nav.openMenu')"
      @click="drawerOpen = !drawerOpen"
    >
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <template #append>
      <nav
        ref="desktopNavRef"
        data-testid="desktop-nav"
        class="desktop-nav header-centerline align-center ga-1"
        :class="{ 'desktop-nav--measure': compactNav }"
        :aria-hidden="compactNav ? 'true' : undefined"
      >
        <template v-for="item in navItems" :key="item.key">
          <v-menu
            v-if="isNavGroup(item)"
            :key="`${item.menuTestId}-${route.fullPath}`"
            location="bottom end"
            :close-on-content-click="true"
            transition="fade-transition"
          >
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                :data-testid="`${item.menuTestId}-toggle`"
                :prepend-icon="item.icon"
                variant="text"
                class="text-none"
                :tabindex="compactNav ? -1 : undefined"
              >
                {{ t(item.key) }}
              </v-btn>
            </template>
            <v-list
              density="compact"
              nav
              bg-color="background"
              :data-testid="`${item.menuTestId}-menu`"
              min-width="160"
            >
              <v-list-item
                v-for="child in item.children"
                :key="child.key"
                :data-testid="`locale-option-${child.locale}`"
                :title="t(child.key)"
                :prepend-icon="child.icon"
                :active="locale === child.locale"
                @click="onLocaleChange(child.locale)"
              />
            </v-list>
          </v-menu>
          <v-btn
            v-else
            :to="item.to"
            :prepend-icon="item.icon"
            variant="text"
            class="text-none"
            :tabindex="compactNav ? -1 : undefined"
          >
            {{ t(item.key) }}
          </v-btn>
        </template>
      </nav>
    </template>
  </v-app-bar>
</template>

<style scoped>
.brand {
  flex-basis: auto;
  min-width: max-content;
  align-self: center;
  margin-block: 0;
  padding-block: 0;
  line-height: 1.25;
}

.brand :deep(.v-toolbar-title__placeholder) {
  display: flex;
  align-items: center;
  overflow: visible;
  width: auto;
  height: 100%;
}

.header-centerline {
  align-self: center;
}

.header-centerline.v-btn--icon {
  height: 2.25rem;
  width: 2.25rem;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  line-height: 1.25;
  height: 2.25rem;
}

.desktop-nav {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  white-space: nowrap;
  height: 2.25rem;
}

.desktop-nav :deep(.v-btn) {
  height: 2.25rem;
  min-height: 2.25rem;
  font-size: var(--v-btn-size);
}

.desktop-nav--measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
}
</style>
