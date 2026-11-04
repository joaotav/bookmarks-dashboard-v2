import type { BrowserContext, Page } from '@playwright/test';
import { addBookmarks, expect, test } from './fixtures';

// The opened tabs get a stub page instead of the real sites, so the tests don't need a network.
test.beforeEach(async ({ context }) => {
  await context.route(/^https?:/, (route) => route.fulfill({ body: 'ok', contentType: 'text/plain' }));
});

/**
 * URLs of the web pages open in the browser, sorted. Playwright lists pages in the order it
 * noticed them, not in tab order; the unit test for openInBackground covers the order.
 */
const opened = (context: BrowserContext) =>
  context
    .pages()
    .map((page) => page.url())
    .filter((url) => url.startsWith('http'))
    .sort();

/**
 * Whether this page's tab is still the one in front. Without the `tabs` permission, which
 * the extension doesn't ask for, it can't read other tabs' URLs, but it can compare IDs.
 */
const inFront = (page: Page) =>
  page.evaluate(async () => {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    return active?.id === (await chrome.tabs.getCurrent())?.id;
  });

const urls = (count: number) => Array.from({ length: count }, (_, i) => `https://example.com/${i}`);
const sorted = (list: string[]) => [...list].sort();

const openAll = async (page: Page, category: string) => {
  await page.getByRole('button', { name: `Actions for ${category}` }).click();
  await page.getByRole('button', { name: 'Open all bookmarks' }).click();
};

test('opens a category\'s web links in background tabs', async ({ context, dashboard }) => {
  await addBookmarks(dashboard, [
    {
      title: 'Work',
      children: [
        {
          title: 'Daily',
          children: [
            { title: 'One', url: urls(2)[0] },
            { title: 'Bookmarklet', url: 'javascript:void 0' },
            { title: 'Two', url: urls(2)[1] },
          ],
        },
      ],
    },
  ]);
  await openAll(dashboard, 'Daily');
  await expect.poll(() => opened(context)).toEqual(urls(2));
  expect(await inFront(dashboard)).toBe(true);
});

test('asks before opening more than 10 tabs', async ({ context, dashboard }) => {
  await addBookmarks(dashboard, [
    { title: 'Work', children: [{ title: 'Reading', children: urls(12).map((url, i) => ({ title: `Page ${i}`, url })) }] },
  ]);

  await openAll(dashboard, 'Reading');
  await expect(dashboard.getByRole('group', { name: 'Open all bookmarks' })).toHaveText(/Open 12 tabs\?/);
  await dashboard.getByRole('button', { name: 'Cancel' }).click();
  await expect(dashboard.getByRole('group', { name: 'Open all bookmarks' })).toBeHidden();
  expect(opened(context)).toEqual([]);

  await openAll(dashboard, 'Reading');
  await dashboard.getByRole('button', { name: 'Open', exact: true }).click();
  await expect.poll(() => opened(context)).toEqual(sorted(urls(12)));
  expect(await inFront(dashboard)).toBe(true);
});
