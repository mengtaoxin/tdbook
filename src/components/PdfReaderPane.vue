<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  loadPdfDocument,
  renderPdfPage,
  type PdfPageRender,
} from '@/lib/pdfReader'

const props = defineProps<{
  pdfUrl: string
  pageNumber: number
}>()

const emit = defineEmits<{
  ready: [value: boolean]
}>()

const hostEl = ref<HTMLElement | null>(null)
const pageEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const textLayerEl = ref<HTMLElement | null>(null)

let paint: PdfPageRender | null = null
let resizeObserver: ResizeObserver | null = null
let lastWidth = 0

function stopPaint() {
  paint?.cancel()
  paint = null
}

function stopResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
  lastWidth = 0
}

async function paintPage() {
  const host = hostEl.value
  const canvas = canvasEl.value
  const textLayer = textLayerEl.value
  const pageNode = pageEl.value
  if (!host || !canvas || !textLayer || !pageNode) return

  const cssWidth = Math.floor(host.clientWidth)
  if (cssWidth < 32) return

  stopPaint()
  emit('ready', false)
  const task = renderPdfPage(await loadPdfDocument(props.pdfUrl), props.pageNumber, {
    canvas,
    textLayerEl: textLayer,
    pageEl: pageNode,
    cssWidth,
  })
  paint = task
  await task.promise
  if (paint === task) {
    emit('ready', true)
  }
}

function observeHost() {
  stopResizeObserver()
  const host = hostEl.value
  if (!host) return

  resizeObserver = new ResizeObserver(() => {
    const width = Math.floor(host.clientWidth)
    if (Math.abs(width - lastWidth) < 1) return
    lastWidth = width
    void paintPage()
  })
  resizeObserver.observe(host)
}

async function sync() {
  await nextTick()
  observeHost()
  await paintPage()
}

watch(
  () => [props.pdfUrl, props.pageNumber] as const,
  () => {
    void sync()
  },
)

onMounted(() => {
  void sync()
})

onUnmounted(() => {
  stopPaint()
  stopResizeObserver()
})
</script>

<template>
  <v-sheet elevation="3" rounded class="mx-auto pdf-sheet">
    <div ref="hostEl" class="pdf-host" data-testid="pdf-host">
      <div ref="pageEl" class="pdf-page">
        <canvas ref="canvasEl" />
        <div ref="textLayerEl" class="textLayer" />
      </div>
    </div>
  </v-sheet>
</template>

<style scoped>
.pdf-sheet {
  max-width: 900px;
}

.pdf-host {
  width: 100%;
}
</style>
