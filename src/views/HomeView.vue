<script setup lang="ts">
const features = [
  {
    icon: 'mdi-book-open-variant',
    title: 'EPUB / PDF',
    description: '从远程目录读取书目，在浏览器内直接打开阅读。',
  },
  {
    icon: 'mdi-database',
    title: '本地缓存',
    description: '首次下载后写入 IndexedDB，之后可离线阅读。',
  },
  {
    icon: 'mdi-cloud-off-outline',
    title: '纯静态部署',
    description: '无后端服务，书目由 configs.json 配置，部署即可用。',
  },
] as const
</script>

<template>
  <v-container class="py-8" style="max-width: 800px">
    <div class="mb-8">
      <h1 class="text-h4 mb-3">图书</h1>
      <p class="text-body-1 text-medium-emphasis mb-2">
        个人电子书浏览器：从远程目录列出 EPUB / PDF 书目，首次打开时下载到本机 IndexedDB，之后即可在浏览器中离线阅读。
      </p>
      <p class="text-body-2 text-medium-emphasis">
        应用以静态页面部署，不依赖后端；书目来源为
        <code>configs.json</code>，可在设置中更换配置地址。
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
