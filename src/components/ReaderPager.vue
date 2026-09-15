<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  page: number
  totalPages: number
  prevPage: number | null
  nextPage: number | null
  wide?: boolean
}>()

const emit = defineEmits<{
  go: [target: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="d-flex align-center justify-space-between mx-auto mt-4 pager"
    :class="{ 'pager-wide': wide }"
  >
    <v-btn
      icon="mdi-chevron-left"
      variant="text"
      color="primary"
      size="large"
      :disabled="prevPage == null"
      :aria-label="t('reader.prevPage')"
      @click="prevPage != null && emit('go', prevPage)"
    />
    <span class="text-medium-emphasis text-body-2">
      {{ t('reader.pageOf', { page, total: totalPages }) }}
    </span>
    <v-btn
      icon="mdi-chevron-right"
      variant="text"
      color="primary"
      size="large"
      :disabled="nextPage == null"
      :aria-label="t('reader.nextPage')"
      @click="nextPage != null && emit('go', nextPage)"
    />
  </div>
</template>

<style scoped>
.pager {
  max-width: 720px;
}

.pager-wide {
  max-width: 900px;
}
</style>
