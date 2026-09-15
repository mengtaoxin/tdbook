<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { listBooks } from '@/lib/bookService'
import type { BookListItem } from '@/lib/bookTypes'

/** Book cover width:height — drives layout instead of fixed px height. */
const COVER_ASPECT_RATIO = 5 / 7
const TITLE_LINE_HEIGHT = 1.4
const TITLE_LINES = 2

const { t } = useI18n()
const router = useRouter()
const books = ref<BookListItem[]>([])
const duplicateIds = ref<string[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const result = await listBooks()
    books.value = result.books
    duplicateIds.value = result.duplicateIds
  } catch {
    error.value = t('books.loadFailed')
  } finally {
    loading.value = false
  }
})

function goToBook(book: BookListItem) {
  void router.push({
    name: 'book',
    params: { id: book.id },
    query: { page: '1' },
  })
}
</script>

<template>
  <div class="books-page">
    <v-container class="books-container py-10">
      <header class="books-header mb-8">
        <h1 class="books-heading text-headline-small font-weight-medium mb-1">
          {{ t('books.title') }}
        </h1>
        <p
          v-if="!loading && books.length > 0"
          class="text-body-medium text-medium-emphasis mb-0"
        >
          {{ t('books.count', { n: books.length }) }}
        </p>
      </header>

      <div v-if="loading" class="books-loading d-flex justify-center py-16">
        <v-progress-circular indeterminate color="primary" size="40" width="3" />
      </div>

      <template v-else>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          rounded="lg"
          class="mb-4"
        >
          {{ error }}
        </v-alert>
        <v-alert
          v-for="id in duplicateIds"
          :key="id"
          type="error"
          variant="tonal"
          rounded="lg"
          class="mb-4"
        >
          {{ t('books.duplicateId', { id }) }}
        </v-alert>

        <p
          v-if="books.length === 0"
          class="text-body-large text-medium-emphasis text-center py-16 mb-0"
        >
          {{ t('books.empty') }}
        </p>

        <v-row v-else class="books-grid" density="compact">
          <v-col
            v-for="book in books"
            :key="book.id"
            cols="6"
            sm="4"
            md="3"
            lg="2"
          >
            <article
              class="book-tile d-flex flex-column"
              role="button"
              tabindex="0"
              @click="goToBook(book)"
              @keydown.enter="goToBook(book)"
            >
              <div class="book-cover">
                <v-img
                  v-if="book.coverUrl"
                  :src="book.coverUrl"
                  :alt="book.title"
                  :aspect-ratio="COVER_ASPECT_RATIO"
                  cover
                  class="book-cover-img"
                />
                <div
                  v-else
                  class="book-cover-placeholder d-flex align-center justify-center"
                >
                  <v-icon icon="mdi-book-outline" size="36" class="book-cover-icon" />
                </div>
              </div>

              <div class="book-meta pt-3 pb-1 px-1">
                <h2 class="book-title text-title-small font-weight-medium mb-0">
                  {{ book.title }}
                </h2>
                <p class="book-author text-body-small text-medium-emphasis text-truncate mb-0">
                  {{ book.author || '\u00A0' }}
                </p>
                <div class="book-chips d-flex flex-wrap ga-1">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="book.cached ? 'primary' : undefined"
                    label
                    class="book-chip"
                  >
                    {{ book.cached ? t('books.cached') : t('books.notDownloaded') }}
                  </v-chip>
                  <v-chip
                    size="x-small"
                    variant="text"
                    label
                    class="book-chip book-chip-type"
                  >
                    {{ book.type.toUpperCase() }}
                  </v-chip>
                </div>
              </div>
            </article>
          </v-col>
        </v-row>
      </template>
    </v-container>
  </div>
</template>

<style scoped>
.books-page {
  --books-cover-radius: 12px;
  --books-ink: rgb(var(--v-theme-on-surface));
  min-height: 100%;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(var(--v-theme-primary), 0.06), transparent 55%),
    rgb(var(--v-theme-background));
}

.books-container {
  max-width: 72rem;
}

.books-heading {
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
}

.books-grid {
  margin-top: 0;
}

.book-tile {
  width: 100%;
  min-width: 0;
  align-self: flex-start;
  cursor: pointer;
  border-radius: calc(var(--books-cover-radius) + 2px);
  outline: none;
  transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
}

.book-tile:hover {
  transform: translateY(-2px);
}

.book-tile:focus-visible .book-cover {
  box-shadow:
    0 0 0 2px rgb(var(--v-theme-surface)),
    0 0 0 4px rgb(var(--v-theme-primary));
}

.book-cover {
  position: relative;
  width: 100%;
  flex: none;
  aspect-ratio: v-bind(COVER_ASPECT_RATIO);
  border-radius: var(--books-cover-radius);
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.04);
  box-shadow:
    0 1px 2px rgba(var(--books-ink), 0.06),
    0 4px 12px rgba(var(--books-ink), 0.06);
  transition: box-shadow 180ms cubic-bezier(0.2, 0, 0, 1);
}

.book-tile:hover .book-cover {
  box-shadow:
    0 2px 4px rgba(var(--books-ink), 0.08),
    0 8px 24px rgba(var(--books-ink), 0.1);
}

.book-cover-img {
  border-radius: var(--books-cover-radius);
}

.book-cover-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    160deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-on-surface), 0.04) 100%
  );
}

.book-cover-icon {
  color: rgba(var(--v-theme-on-surface), 0.28);
}

.book-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.book-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: v-bind(TITLE_LINES);
  overflow: hidden;
  line-height: v-bind(TITLE_LINE_HEIGHT);
  height: calc(v-bind(TITLE_LINE_HEIGHT) * 1em * v-bind(TITLE_LINES));
  overflow-wrap: anywhere;
  color: rgb(var(--v-theme-on-surface));
}

.book-author {
  height: 1.25em;
  line-height: 1.25em;
}

.book-chip {
  font-weight: 500;
  letter-spacing: 0.02em;
}

.book-chip-type {
  opacity: 0.7;
}
</style>
