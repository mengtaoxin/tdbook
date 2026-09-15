import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#3D5A80',
          secondary: '#6B7C8F',
          surface: '#FFFBFE',
          background: '#F5F6F8',
          error: '#BA1A1A',
          'on-primary': '#FFFFFF',
          'on-surface': '#1B1C1E',
          'on-background': '#1B1C1E',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
    },
    VChip: {
      rounded: 'lg',
    },
    VCard: {
      rounded: 'xl',
    },
    VAlert: {
      rounded: 'lg',
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})
