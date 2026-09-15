<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EpubReaderPane from '@/components/EpubReaderPane.vue'
import PdfReaderPane from '@/components/PdfReaderPane.vue'
import ReaderPager from '@/components/ReaderPager.vue'
import { type CacheProgress } from '@/lib/bookCache'
import { getBook } from '@/lib/bookService'
import { bookPageCount, type BookRecord } from '@/lib/bookTypes'
import { getFormatAdapter, type PageContent } from '@/lib/formats'
import '@/lib/pdfTextLayer.css'

const props = defineProps<{
  id: string
}>()

const route = useRoute()
const router = useRouter()

const book = ref<BookRecord | null>(null)
const pageContent = ref<PageContent | null>(null)
const loading = ref(true)
const error = ref('')
const pdfReady = ref(false)
const cacheProgress = ref<CacheProgress | null>(null)

const page = computed(() => {
  const raw = route.query.page
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(parsed) ? parsed : Number.NaN
})

const totalPages = computed(() =>
  book.value ? bookPageCount(book.value) : 0,
)

const progressLabel = computed(() => {
  const progress = cacheProgress.value
  if (!progress || progress.phase === 'done') return ''
  if (progress.phase === 'download') {
    if (progress.total && progress.total > 0) {
      const pct = Math.min(100, Math.round((progress.loaded / progress.total) * 100))
      return `正在下载图书… ${pct}%`
    }
    return '正在下载图书…'
  }
  if (progress.phase === 'extract') {
    if (progress.total && progress.total > 0) {
      return `正在解压 EPUB… ${progress.loaded}/${progress.total}`
    }
    return '正在解压 EPUB…'
  }
  return ''
})

const prevPage = computed(() =>
  book.value && page.value > 1 ? page.value - 1 : null,
)
const nextPage = computed(() =>
  book.value && page.value < totalPages.value ? page.value + 1 : null,
)

const routeHash = computed(() =>
  typeof route.hash === 'string' ? route.hash : '',
)

function goToPage(target: number) {
  router.push({
    name: 'book',
    params: { id: props.id },
    query: { page: String(target) },
  })
}

async function load() {
  error.value = ''
  pageContent.value = null
  pdfReady.value = false
  const switchingBook = !book.value || book.value.id !== props.id
  if (switchingBook || book.value?.type !== 'pdf') {
    loading.value = true
  }

  try {
    if (switchingBook) {
      cacheProgress.value = { phase: 'download', loaded: 0, total: null }
      book.value = await getBook(props.id, (progress) => {
        cacheProgress.value = progress
      })
      cacheProgress.value = null
    }

    if (!book.value || totalPages.value === 0) {
      error.value = '未找到图书。'
      return
    }

    if (!route.query.page) {
      await router.replace({
        name: 'book',
        params: { id: props.id },
        query: { page: '1' },
      })
      return
    }

    if (
      !Number.isInteger(page.value) ||
      page.value < 1 ||
      page.value > totalPages.value
    ) {
      error.value = '页码无效。'
      return
    }

    const adapter = getFormatAdapter(book.value.type)
    const content = await adapter.getPage(book.value, page.value - 1)
    if (!content) {
      error.value = '无法加载该页内容。'
      return
    }

    pageContent.value = content
    if (content.type === 'pdf') {
      loading.value = false
    }
  } catch (err) {
    cacheProgress.value = null
    error.value = err instanceof Error ? err.message : '加载失败。'
  } finally {
    loading.value = false
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft' && prevPage.value != null) {
    goToPage(prevPage.value)
  }
  if (event.key === 'ArrowRight' && nextPage.value != null) {
    goToPage(nextPage.value)
  }
}

watch(
  () => [props.id, route.query.page] as const,
  () => {
    void load()
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  void load()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <v-container class="py-4">
    <div v-if="progressLabel" class="mb-6">
      <p class="text-body-2 text-medium-emphasis mb-2">{{ progressLabel }}</p>
      <v-progress-linear
        :indeterminate="!cacheProgress?.total"
        :model-value="
          cacheProgress?.total
            ? Math.min(100, (cacheProgress.loaded / cacheProgress.total) * 100)
            : 0
        "
        color="primary"
      />
    </div>
    <v-progress-linear
      v-else-if="loading || (pageContent?.type === 'pdf' && !pdfReady && !error)"
      indeterminate
      color="primary"
      class="mb-6"
    />
    <v-alert v-if="error && !loading" type="error" variant="tonal">
      {{ error }}
    </v-alert>

    <template v-if="pageContent?.type === 'pdf' && book && !error">
      <PdfReaderPane
        :pdf-url="pageContent.pdfUrl"
        :page-number="pageContent.pageNumber"
        @ready="pdfReady = $event"
      />
      <p v-if="!pdfReady" class="text-center text-medium-emphasis mt-4">
        正在绘制页面…
      </p>
      <ReaderPager
        wide
        :page="page"
        :total-pages="totalPages"
        :prev-page="prevPage"
        :next-page="nextPage"
        @go="goToPage"
      />
    </template>

    <template v-else-if="pageContent?.type === 'epub' && book && !error">
      <EpubReaderPane
        :rewritten="pageContent.rewritten"
        :hash="routeHash"
      />
      <ReaderPager
        :page="page"
        :total-pages="totalPages"
        :prev-page="prevPage"
        :next-page="nextPage"
        @go="goToPage"
      />
    </template>
  </v-container>
</template>
