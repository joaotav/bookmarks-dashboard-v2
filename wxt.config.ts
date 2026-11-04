import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'wxt';

// Snap-packaged Firefox can't read profiles in /tmp, where web-ext puts them by default,
// so `npm run dev:firefox` uses a persistent profile inside the project instead.
const firefoxProfile = resolve('.dev-profiles/firefox');
mkdirSync(firefoxProfile, { recursive: true });

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  webExt: {
    firefoxProfile,
    keepProfileChanges: true,
  },
  // In dev mode, extension pages load their scripts from the Vite dev server. Chrome skips
  // the cross-origin check through the dev manifest's localhost host permission, but Firefox
  // MV3 doesn't grant host permissions by default, so the dev server must allow the origin.
  vite: () => ({
    server: { cors: { origin: /^moz-extension:\/\// } },
  }),
  // WXT targets MV2 for Firefox by default. Both browsers use MV3 (ADR 0002).
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Bookmarks Dashboard',
    description: 'New tab page with the links you are working on, organized into spaces and categories.',
    permissions: ['bookmarks', 'storage', 'activeTab', ...(browser === 'chrome' ? ['favicon'] : [])],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // Permanent: storage.local and storage.sync are tied to this ID.
          id: '{a0312999-36b3-4b7d-bb6d-a9d2647a5427}',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
