/** Web app manifest fields shared by vite-plugin-pwa and unit tests. */
export const pwaManifest = {
  name: 'tdbook',
  short_name: 'tdbook',
  description:
    'Personal ebook browser: catalog from configs.json, read EPUB/PDF offline after first download.',
  theme_color: '#3D5A80',
  background_color: '#3D5A80',
  display: 'standalone' as const,
  start_url: '/',
  lang: 'en',
  icons: [
    {
      src: '/icons/pwa-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any' as const,
    },
    {
      src: '/icons/pwa-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any' as const,
    },
    {
      src: '/icons/pwa-512-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable' as const,
    },
  ],
};
