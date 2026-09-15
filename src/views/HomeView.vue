<script setup lang="ts">
const features = [
  {
    icon: 'mdi-book-open-variant',
    title: '多种格式',
    description: '支持常见的电子书与 PDF，打开即可在网页里阅读。',
  },
  {
    icon: 'mdi-download',
    title: '本机保存',
    description: '第一次打开时会自动下载到本机，之后无需反复加载。',
  },
  {
    icon: 'mdi-cloud-off-outline',
    title: '离线阅读',
    description: '书下载完成后，没有网络也能继续翻页阅读。',
  },
] as const
</script>

<template>
  <v-container class="py-8" style="max-width: 800px">
    <div class="mb-8">
      <h1 class="text-h4 mb-3">tdbook</h1>
      <p class="text-body-1 text-medium-emphasis mb-2">
        个人电子书阅读器：在浏览器里浏览书目、打开电子书或 PDF，第一次阅读时会下载到本机，之后即使没有网络也能继续读。
      </p>
      <p class="text-body-2 text-medium-emphasis">
        书目由配置文件提供，如需更换书单来源，可在设置中修改配置地址。
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
      浏览图书列表
    </v-btn>
  </v-container>
</template>
