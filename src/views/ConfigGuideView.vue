<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()

const exampleJson = `{
  "books": [
    {
      "id": "alices-adventures-in-wonderland",
      "title": "Alice's Adventures in Wonderland",
      "author": "Lewis Carroll",
      "type": "epub",
      "path": "/sample.epub",
      "hover": "/sample.jpg"
    },
    {
      "id": "sample-pdf",
      "title": "Sample PDF",
      "type": "pdf",
      "path": "https://example.com/books/sample.pdf"
    }
  ]
}`

const fields = computed(() =>
  (
    [
      { name: 'id', required: true, key: 'id' },
      { name: 'title', required: true, key: 'title' },
      { name: 'author', required: false, key: 'author' },
      { name: 'type', required: false, key: 'type' },
      { name: 'path', required: true, key: 'path' },
      { name: 'hover', required: false, key: 'hover' },
    ] as const
  ).map((field) => ({
    ...field,
    description: t(`configGuide.fields.${field.key}`),
  })),
)
</script>

<template>
  <v-container class="py-8" style="max-width: 720px">
    <h1 class="text-h5 mb-2">{{ t('configGuide.title') }}</h1>
    <p class="text-body-medium text-medium-emphasis mb-8">
      {{ t('configGuide.introBefore') }}
      <code>/configs.json</code>{{ t('configGuide.introAfter') }}
    </p>

    <h2 class="text-h6 mb-3">{{ t('configGuide.stepsTitle') }}</h2>
    <ol class="text-body-medium mb-8 pl-4">
      <li class="mb-2">
        {{ t('configGuide.step1Before') }}
        <code>configs.json</code>{{ t('configGuide.step1After') }}
      </li>
      <li class="mb-2">
        {{ t('configGuide.step2Before') }}
        <RouterLink :to="{ name: 'settings' }" class="text-primary">
          {{ t('configGuide.settingsLink') }}
        </RouterLink>
        {{ t('configGuide.step2Middle') }}
        <code>configs.json</code>{{ t('configGuide.step2After') }}
        <code>https://example.com/configs.json</code>{{ t('configGuide.step2End') }}
      </li>
      <li>
        {{ t('configGuide.step3Before') }}
        <RouterLink :to="{ name: 'books' }" class="text-primary">
          {{ t('configGuide.booksLink') }}
        </RouterLink>
        {{ t('configGuide.step3After') }}
      </li>
    </ol>

    <h2 class="text-h6 mb-3">{{ t('configGuide.structureTitle') }}</h2>
    <p class="text-body-medium text-medium-emphasis mb-3">
      {{ t('configGuide.structureIntroBefore') }}
      <code>books</code>{{ t('configGuide.structureIntroAfter') }}
    </p>
    <v-table density="comfortable" class="mb-8 field-table">
      <thead>
        <tr>
          <th>{{ t('configGuide.colField') }}</th>
          <th>{{ t('configGuide.colRequired') }}</th>
          <th>{{ t('configGuide.colDescription') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="field in fields" :key="field.name">
          <td>
            <code>{{ field.name }}</code>
          </td>
          <td>{{ field.required ? t('configGuide.yes') : t('configGuide.no') }}</td>
          <td class="text-medium-emphasis">{{ field.description }}</td>
        </tr>
      </tbody>
    </v-table>

    <h2 class="text-h6 mb-3">{{ t('configGuide.exampleTitle') }}</h2>
    <pre class="example-json mb-8">{{ exampleJson }}</pre>

    <h2 class="text-h6 mb-3">{{ t('configGuide.notesTitle') }}</h2>
    <ul class="text-body-medium text-medium-emphasis pl-4 mb-0">
      <li class="mb-2">
        {{ t('configGuide.noteInvalid') }}
      </li>
      <li class="mb-2">
        {{ t('configGuide.noteDuplicateBefore') }}
        <code>id</code>{{ t('configGuide.noteDuplicateAfter') }}
      </li>
      <li class="mb-2">
        {{ t('configGuide.noteCors') }}
      </li>
      <li>
        {{ t('configGuide.noteCacheBefore') }}
        {{ t('configGuide.clearCacheQuoted') }}
        {{ t('configGuide.noteCacheAfter') }}
      </li>
    </ul>
  </v-container>
</template>

<style scoped>
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875em;
}

.example-json {
  margin: 0;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.55;
  white-space: pre;
}

.field-table :deep(td),
.field-table :deep(th) {
  vertical-align: top;
}
</style>
