<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const navItems = [
  { title: '首页', to: { name: 'home' } },
  { title: '图书列表', to: { name: 'books' } },
  { title: '设置', to: { name: 'settings' } },
  { title: '关于', to: { name: 'about' } },
] as const
</script>

<template>
  <v-app>
    <v-app-bar color="primary" elevation="1">
      <v-app-bar-title>
        <RouterLink
          :to="{ name: 'home' }"
          class="d-inline-flex align-center text-inherit text-decoration-none"
        >
          <v-icon icon="mdi-book-open-page-variant" class="mr-2" />
          图书
        </RouterLink>
      </v-app-bar-title>
      <template #append>
        <v-btn
          v-for="item in navItems"
          :key="item.title"
          :to="item.to"
          variant="text"
          class="text-none"
        >
          {{ item.title }}
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
