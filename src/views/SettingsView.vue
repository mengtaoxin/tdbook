<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { translateError } from '@/i18n'
import { clearAllBookCaches } from '@/lib/bookCache'
import {
  DEFAULT_CONFIGS_URL,
  getStoredConfigsUrl,
  setConfigsUrl,
} from '@/lib/settings'

const { t } = useI18n()

const configsUrl = ref(getStoredConfigsUrl())
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const confirmClear = ref(false)
const clearing = ref(false)

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
}

function save() {
  try {
    setConfigsUrl(configsUrl.value)
    configsUrl.value = getStoredConfigsUrl()
    showMessage(
      configsUrl.value
        ? t('settings.saved')
        : t('settings.usingDefault', { url: DEFAULT_CONFIGS_URL }),
      'success',
    )
  } catch (err) {
    showMessage(translateError(err, 'settings.saveFailed'), 'error')
  }
}

function restoreDefault() {
  try {
    setConfigsUrl('')
    configsUrl.value = ''
    showMessage(
      t('settings.restoredDefault', { url: DEFAULT_CONFIGS_URL }),
      'success',
    )
  } catch (err) {
    showMessage(translateError(err, 'settings.restoreFailed'), 'error')
  }
}

function closeClearConfirm() {
  if (clearing.value) return
  confirmClear.value = false
}

async function confirmClearCache() {
  if (clearing.value) return
  clearing.value = true
  try {
    await clearAllBookCaches()
    confirmClear.value = false
    showMessage(t('settings.cacheCleared'), 'success')
  } catch {
    showMessage(t('settings.clearCacheFailed'), 'error')
  } finally {
    clearing.value = false
  }
}
</script>

<template>
  <v-container class="py-8" style="max-width: 640px">
    <h1 class="text-h5 mb-6">{{ t('settings.title') }}</h1>

    <v-alert
      v-if="message"
      :type="messageType"
      variant="tonal"
      density="compact"
      class="mb-4"
      closable
      @click:close="message = ''"
    >
      {{ message }}
    </v-alert>

    <v-text-field
      v-model="configsUrl"
      :label="t('settings.configsUrlLabel')"
      :placeholder="DEFAULT_CONFIGS_URL"
      :hint="t('settings.configsUrlHint')"
      persistent-hint
      clearable
      autocomplete="off"
      class="mb-2"
    />
    <p class="text-body-small mb-4">
      <RouterLink :to="{ name: 'config-guide' }" class="text-primary">
        {{ t('settings.viewConfigGuide') }}
      </RouterLink>
    </p>

    <div class="d-flex flex-wrap ga-3 mb-10">
      <v-btn color="primary" variant="flat" class="text-none" @click="save">
        {{ t('settings.save') }}
      </v-btn>
      <v-btn variant="outlined" class="text-none" @click="restoreDefault">
        {{ t('settings.restoreDefault') }}
      </v-btn>
    </div>

    <h2 class="text-h6 mb-2">{{ t('settings.cacheTitle') }}</h2>
    <p class="text-body-medium text-medium-emphasis mb-4">
      {{ t('settings.cacheDescription') }}
    </p>
    <v-btn
      color="error"
      variant="outlined"
      class="text-none"
      prepend-icon="mdi-cached"
      @click="confirmClear = true"
    >
      {{ t('settings.clearCache') }}
    </v-btn>
  </v-container>

  <v-dialog
    :model-value="confirmClear"
    max-width="22rem"
    :persistent="clearing"
    @update:model-value="(open) => !open && closeClearConfirm()"
  >
    <v-card rounded="xl" elevation="0">
      <v-card-title class="text-title-large font-weight-medium pt-6 px-6">
        {{ t('settings.clearCacheConfirmTitle') }}
      </v-card-title>
      <v-card-text class="text-body-medium px-6 pb-2">
        {{ t('settings.clearCacheConfirmBody') }}
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn
          variant="text"
          class="text-none"
          :disabled="clearing"
          @click="closeClearConfirm"
        >
          {{ t('settings.cancel') }}
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          class="text-none"
          rounded="lg"
          :loading="clearing"
          @click="confirmClearCache"
        >
          {{ t('settings.clear') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
