<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView } from 'vue-router'
import { setAppLocale } from '@/i18n'
import {
  SUPPORTED_LOCALES,
  setStoredLocale,
  type AppLocale,
} from '@/lib/locale'

const { t, locale } = useI18n()

const navItems = computed(() => [
  { title: t('nav.home'), to: { name: 'home' } },
  { title: t('nav.books'), to: { name: 'books' } },
  { title: t('nav.settings'), to: { name: 'settings' } },
  { title: t('nav.configGuide'), to: { name: 'config-guide' } },
  { title: t('nav.about'), to: { name: 'about' } },
])

const localeLabel = computed(() => t(`locale.${locale.value}`))

function onLocaleChange(value: unknown) {
  if (value !== 'en' && value !== 'zh') return
  const next = value as AppLocale
  try {
    setStoredLocale(next)
    setAppLocale(next)
  } catch {
    // localStorage may be unavailable; keep current locale
  }
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" elevation="1">
      <v-app-bar-title>
        <RouterLink
          :to="{ name: 'home' }"
          class="d-inline-flex align-center text-inherit text-decoration-none"
        >
          <v-icon icon="mdi-book-open-page-variant" class="mr-2" />
          tdbook
        </RouterLink>
      </v-app-bar-title>
      <template #append>
        <v-btn
          v-for="item in navItems"
          :key="item.to.name"
          :to="item.to"
          variant="text"
          class="text-none"
        >
          {{ item.title }}
        </v-btn>
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="text"
              class="text-none"
              :aria-label="t('locale.label')"
              prepend-icon="mdi-translate"
            >
              {{ localeLabel }}
            </v-btn>
          </template>
          <v-list density="compact" nav bg-color="background">
            <v-list-item
              v-for="code in SUPPORTED_LOCALES"
              :key="code"
              :title="t(`locale.${code}`)"
              :active="locale === code"
              @click="onLocaleChange(code)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
