import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'wxt';

// Snap-packaged Firefox can't read profiles in /tmp, where web-ext puts them by default,
// so `npm run dev:firefox` uses a persistent profile inside the project instead.
const firefoxProfile = resolve('.dev-profiles/firefox');
mkdirSync(firefoxProfile, { recursive: true });

// The public half of a key pair that fixes the extension's ID in Chrome, which otherwise
// derives it from the folder an unpacked extension is loaded from. storage.sync needs the
// same ID on every computer (ADR 0006). It isn't secret; the private half is kept elsewhere.
const chromeKey =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0afWPVBCn9B4yiCmM6bMuDtH4H+lxyCAiYS9lCUdqrc1oVAvjNBltW9Ia190NMNg7o4xMjq3WavqjvGylAeXeBwrJDQZg7BTZxo0pp3UoHBmj61GBBbRe+0upvGAn9kowI+Zj5gOFC8sTqfSuRz9MIX5c7SN5CzhgZzT0CYJRLP1MpUr/QfeUvW+gEn/bOkmokiigY76xfxx8sVEjBZJVEQq2PvldvtdOETqgfwBv7EEIerawpqvFWsXq1fljPhat8KVVqrjach6IKCffc11u8gyF0K4Q3gE6dAvpsPjNJL0tm6S4JXXpts8vcLfbLOLRCzDAqawZQHflD5M3L8JhQIDAQAB';

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
    name: 'Chickadee',
    description: 'New tab page with the links you are working on, organized into spaces and categories.',
    permissions: ['bookmarks', 'storage', 'activeTab', ...(browser === 'chrome' ? ['favicon'] : [])],
    ...(browser === 'chrome' && { key: chromeKey }),
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
