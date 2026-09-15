<script setup lang="ts">
const projectUrl = 'https://github.com/mengtaoxin/tdbook'
</script>

<template>
  <v-container class="py-8" style="max-width: 640px">
    <h1 class="text-h5 mb-6">关于</h1>

    <p class="text-body-1 text-medium-emphasis mb-6">
      tdbook 是一个个人电子书浏览器：从配置文件读取书目，在浏览器中打开 EPUB / PDF，首次阅读时下载到本机，之后可离线阅读。纯静态部署，无需后端。
    </p>

    <h2 class="text-h6 mb-2">项目地址</h2>
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
