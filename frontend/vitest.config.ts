import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 60,
          statements: 70,
        },
      },
  },
})
