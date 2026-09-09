/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { powerApps } from '@microsoft/power-apps-vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    powerApps()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // CRITICAL: keep Playwright's E2E specs away from Vitest.
    // Vitest's default `include` matches tests/e2e/*.spec.ts, so without this
    // it tries to run Playwright's `test()` inside jsdom and `npm test` fails
    // for the whole repo.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  }
})
