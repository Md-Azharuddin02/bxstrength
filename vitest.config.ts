import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      '**/.git/**',
    ],
    environmentMatchGlobs: [
      ['tests/unit/frontend/**', 'jsdom'],
    ],
    setupFiles: ['./tests/helpers/test-env.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
