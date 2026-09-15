<script setup lang="ts">
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
      aria-label="上一页"
      @click="prevPage != null && emit('go', prevPage)"
    />
    <span class="text-medium-emphasis text-body-2">
      第 {{ page }} / {{ totalPages }} 页
    </span>
    <v-btn
      icon="mdi-chevron-right"
      variant="text"
      color="primary"
      size="large"
      :disabled="nextPage == null"
      aria-label="下一页"
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
