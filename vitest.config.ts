import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
    // Colocated with source (Vitest default would also match e2e/*.spec.ts).
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    // happy-dom fetches <link rel="stylesheet"> during DOMParser; real browsers do not.
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true,
          disableJavaScriptFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Unit tests target lib; UI routes/components are covered by e2e smoke.
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: ['src/lib/**/*.test.ts'],
    },
  },
});
