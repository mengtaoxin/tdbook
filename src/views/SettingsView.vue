<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { clearAllBookCaches } from '@/lib/bookCache'
import {
  DEFAULT_CONFIGS_URL,
  getStoredConfigsUrl,
  setConfigsUrl,
} from '@/lib/settings'

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
        ? '已保存图书配置文件地址。'
        : `已使用默认地址（${DEFAULT_CONFIGS_URL}）。`,
      'success',
    )
  } catch (err) {
    showMessage(err instanceof Error ? err.message : '保存失败。', 'error')
  }
}

function restoreDefault() {
  try {
    setConfigsUrl('')
    configsUrl.value = ''
    showMessage(`已恢复默认地址（${DEFAULT_CONFIGS_URL}）。`, 'success')
  } catch (err) {
    showMessage(err instanceof Error ? err.message : '恢复失败。', 'error')
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
    showMessage('已清除全部图书缓存。下次打开需重新下载。', 'success')
  } catch {
    showMessage('清除缓存失败。', 'error')
  } finally {
    clearing.value = false
  }
}
</script>

<template>
  <v-container class="py-8" style="max-width: 640px">
    <h1 class="text-h5 mb-6">设置</h1>

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
      label="图书配置文件地址"
      :placeholder="DEFAULT_CONFIGS_URL"
      hint="留空使用默认 /configs.json；也可填写 https://…/configs.json"
      persistent-hint
      clearable
      autocomplete="off"
      class="mb-2"
    />
    <p class="text-body-small mb-4">
      <RouterLink :to="{ name: 'config-guide' }" class="text-primary">
        查看配置说明
      </RouterLink>
    </p>

    <div class="d-flex flex-wrap ga-3 mb-10">
      <v-btn color="primary" variant="flat" class="text-none" @click="save">
        保存
      </v-btn>
      <v-btn variant="outlined" class="text-none" @click="restoreDefault">
        恢复默认
      </v-btn>
    </div>

    <h2 class="text-h6 mb-2">缓存</h2>
    <p class="text-body-medium text-medium-emphasis mb-4">
      清除本机已下载的全部图书文件。下次打开任意图书时需重新下载。
    </p>
    <v-btn
      color="error"
      variant="outlined"
      class="text-none"
      prepend-icon="mdi-cached"
      @click="confirmClear = true"
    >
      清除全部缓存
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
        清除全部缓存？
      </v-card-title>
      <v-card-text class="text-body-medium px-6 pb-2">
        将删除本机所有图书的本地缓存，下次打开需重新下载。
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn
          variant="text"
          class="text-none"
          :disabled="clearing"
          @click="closeClearConfirm"
        >
          取消
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          class="text-none"
          rounded="lg"
          :loading="clearing"
          @click="confirmClearCache"
        >
          清除
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
