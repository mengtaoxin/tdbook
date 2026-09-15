import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import router from './router'
import vuetify from './plugins/vuetify'
import './style.css'

createApp(App).use(i18n).use(router).use(vuetify).mount('#app')
