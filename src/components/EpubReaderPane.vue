<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  attachEpubShadow,
  clearEpubShadow,
  renderEpubShadow,
  scrollEpubHash,
} from '@/lib/epubShadow'
import type { RewrittenPage } from '@/lib/rewriteHtml'

const props = defineProps<{
  rewritten: RewrittenPage
  hash?: string
}>()

const hostEl = ref<HTMLElement | null>(null)
let shadow: ShadowRoot | null = null

async function paint() {
  const host = hostEl.value
  if (!host) return
  shadow = attachEpubShadow(host)
  renderEpubShadow(shadow, props.rewritten, host)
  if (props.hash) {
    scrollEpubHash(shadow, props.hash)
  }
}

watch(
  () => [props.rewritten, props.hash] as const,
  async () => {
    await nextTick()
    await paint()
  },
)

onMounted(() => {
  void paint()
})

onUnmounted(() => {
  clearEpubShadow(shadow)
  shadow = null
})
</script>

<template>
  <v-sheet elevation="3" rounded class="mx-auto pa-6 pa-sm-10 epub-sheet">
    <div ref="hostEl" class="epub-content" data-testid="epub-content" />
  </v-sheet>
</template>

<style scoped>
.epub-sheet {
  max-width: 720px;
  min-height: 70vh;
}

.epub-content {
  display: block;
}
</style>
