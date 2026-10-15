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
    // DOMParser must not fetch subresources (real browsers do not); CSS loading
    // is already off by default since happy-dom 21.
    environmentOptions: {
      happyDOM: {
        settings: {
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
