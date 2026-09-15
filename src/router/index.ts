import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import BooksView from '@/views/BooksView.vue'
import SettingsView from '@/views/SettingsView.vue'
import ConfigGuideView from '@/views/ConfigGuideView.vue'
import AboutView from '@/views/AboutView.vue'
import BookReaderView from '@/views/BookReaderView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/books',
      name: 'books',
      component: BooksView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/config-guide',
      name: 'config-guide',
      component: ConfigGuideView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/book/:id',
      name: 'book',
      component: BookReaderView,
      props: true,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
