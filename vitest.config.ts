import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// End-to-end tests in tests/e2e run with Playwright instead, see playwright.config.ts.
export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        extends: true,
        // WXT adds the Svelte compiler only when building the extension, so tests add it here.
        // svelteTesting uses Svelte's browser build and removes rendered components after each test.
        plugins: [svelte(), svelteTesting()],
        test: {
          name: 'component',
          include: ['tests/component/**/*.test.ts'],
          environment: 'jsdom',
          setupFiles: ['tests/component/setup.ts'],
        },
      },
    ],
  },
});
