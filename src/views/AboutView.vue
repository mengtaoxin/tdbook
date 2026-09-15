<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const projectUrl = 'https://github.com/mengtaoxin/tdbook'
</script>

<template>
  <v-container class="py-8" style="max-width: 640px">
    <h1 class="text-h5 mb-6">{{ t('about.title') }}</h1>

    <p class="text-body-1 text-medium-emphasis mb-6">
      {{ t('about.body') }}
    </p>

    <h2 class="text-h6 mb-2">{{ t('about.projectUrl') }}</h2>
    <a
      :href="projectUrl"
      class="text-body-1 text-primary text-decoration-none"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ projectUrl }}
    </a>
  </v-container>
</template>
