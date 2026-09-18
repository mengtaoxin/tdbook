<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  configGuideMarkdownUrl,
  renderMarkdown,
} from '@/lib/configGuideMarkdown'

const { t, locale } = useI18n()

const html = ref('')
const loadError = ref(false)
const loading = ref(true)

async function loadGuide(localeValue: string) {
  loading.value = true
  loadError.value = false
  html.value = ''
  try {
    const response = await fetch(configGuideMarkdownUrl(localeValue))
    if (!response.ok) {
      loadError.value = true
      return
    }
    const source = await response.text()
    html.value = renderMarkdown(source)
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(
  locale,
  (value) => {
    void loadGuide(String(value))
  },
  { immediate: true },
)
</script>

<template>
  <v-container class="py-8" style="max-width: 720px">
    <p v-if="loading" class="text-body-2 text-medium-emphasis">
      {{ t('configGuide.loading') }}
    </p>
    <p v-else-if="loadError" class="text-body-2 text-error">
      {{ t('configGuide.loadError') }}
    </p>
    <div v-else class="guide-md" v-html="html" />
  </v-container>
</template>

<style scoped>
.guide-md :deep(h1) {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.guide-md :deep(h2) {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  margin: 1.5rem 0 0.5rem;
}

.guide-md :deep(p) {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.guide-md :deep(ol),
.guide-md :deep(ul) {
  margin: 0 0 0.75rem;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.guide-md :deep(li) {
  margin-bottom: 0.25rem;
}

.guide-md :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
}

.guide-md :deep(pre) {
  margin: 0 0 0.75rem;
  overflow-x: auto;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.8125rem;
  line-height: 1.55;
}

.guide-md :deep(pre code) {
  font-size: inherit;
  white-space: pre-wrap;
}
</style>
