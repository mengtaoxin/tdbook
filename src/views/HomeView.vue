<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const features = computed(() => [
  {
    icon: 'mdi-book-open-variant',
    title: t('home.features.formats.title'),
    description: t('home.features.formats.description'),
  },
  {
    icon: 'mdi-download',
    title: t('home.features.local.title'),
    description: t('home.features.local.description'),
  },
  {
    icon: 'mdi-cloud-off-outline',
    title: t('home.features.offline.title'),
    description: t('home.features.offline.description'),
  },
])
</script>

<template>
  <v-container class="py-8" style="max-width: 800px">
    <div class="mb-8">
      <h1 class="text-h4 mb-3">tdbook</h1>
      <p class="text-body-1 text-medium-emphasis mb-2">
        {{ t('home.tagline') }}
      </p>
      <p class="text-body-2 text-medium-emphasis">
        {{ t('home.catalogHint') }}
      </p>
    </div>

    <v-row class="mb-8">
      <v-col
        v-for="feature in features"
        :key="feature.title"
        cols="12"
        sm="4"
      >
        <div class="d-flex flex-column ga-2">
          <v-icon :icon="feature.icon" color="primary" size="large" />
          <div class="text-subtitle-1">{{ feature.title }}</div>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ feature.description }}
          </p>
        </div>
      </v-col>
    </v-row>

    <v-btn
      color="primary"
      variant="flat"
      class="text-none"
      :to="{ name: 'books' }"
    >
      {{ t('home.browseBooks') }}
    </v-btn>
  </v-container>
</template>
