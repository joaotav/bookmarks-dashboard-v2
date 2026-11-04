import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { test as base, chromium, expect, type BrowserContext, type Page } from '@playwright/test';

declare global {
  // Code passed to page.evaluate() runs inside the extension page, where Chrome's `chrome` API exists.
  const chrome: typeof import('wxt/browser').browser;
}

const extensionPath = resolve('.output/chrome-mv3');

// Chrome names an unpacked extension after a hash of its folder path. The extension has no
// background script to ask, so the ID is worked out the same way here.
const extensionId = [...createHash('sha256').update(extensionPath).digest('hex').slice(0, 32)]
  .map((digit) => String.fromCharCode(97 + parseInt(digit, 16)))
  .join('');

/** A bookmark to create: a folder when it has `children`, a link when it has a `url`. */
export interface Seed {
  title: string;
  url?: string;
  children?: Seed[];
}

export const test = base.extend<{
  /** Opens the new tab page in another tab, like pressing Ctrl+T. */
  newTab: () => Promise<Page>;
  /** The new tab page, on first run with an empty Workspace. */
  dashboard: Page;
}>({
  // Every test gets a fresh browser profile with the extension installed.
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  newTab: async ({ context }, use) => {
    await use(async () => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/newtab.html`);
      return page;
    });
  },
  dashboard: async ({ newTab }, use) => {
    const page = await newTab();
    // The empty state appears once the Workspace folder exists.
    await expect(page.getByText('Your workspace is empty.')).toBeVisible();
    await use(page);
  },
});

export { expect };

/**
 * Creates bookmarks inside `parentId` (the Workspace folder by default) through the real
 * bookmarks API, the same as adding them in the browser's bookmark manager. Returns the new
 * IDs by title.
 */
export async function addBookmarks(page: Page, seeds: Seed[], parentId?: string): Promise<Record<string, string>> {
  return page.evaluate(
    async ({ seeds, parentId }) => {
      const ids: Record<string, string> = {};
      const create = async (seed: Seed, parent: string) => {
        const node = await chrome.bookmarks.create({ parentId: parent, title: seed.title, url: seed.url });
        ids[seed.title] = node.id;
        for (const child of seed.children ?? []) await create(child, node.id);
      };
      const workspace = (await chrome.storage.local.get('workspaceRootId')).workspaceRootId as string;
      for (const seed of seeds) await create(seed, parentId ?? workspace);
      return ids;
    },
    { seeds, parentId },
  );
}
