import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // @testing-library/react's afterEach(cleanup) auto-registers only when a global `afterEach`
    // exists — without this, DOM from one component test leaks into the next.
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: ['node_modules/', 'src/test/', '**/*.config.ts', 'e2e/'],
    },
  },
})
