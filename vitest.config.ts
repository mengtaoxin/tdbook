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
    environment: 'jsdom',
    // Colocated with source (Vitest default would also match e2e/*.spec.ts).
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Unit tests target lib; UI routes/components are covered by e2e smoke.
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: ['src/lib/**/*.test.ts'],
    },
  },
});
