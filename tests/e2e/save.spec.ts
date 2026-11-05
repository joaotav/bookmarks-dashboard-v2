import type { Page } from '@playwright/test';
import { addBookmarks, expect, test, type Seed } from './fixtures';

const sample: Seed[] = [
  {
    title: '💼 Work',
    children: [
      { title: 'Repos', children: [{ title: 'GitHub', url: 'https://github.com/' }] },
      { title: 'Docs', children: [] },
    ],
  },
  { title: 'Home', children: [{ title: 'Media', children: [] }] },
];

const gitlab = { url: 'https://gitlab.com/explore', title: 'Explore · GitLab' };

/** Titles of the links directly in a folder, as the browser's bookmark manager shows them. */
const childTitles = (page: Page, id: string) =>
  page.evaluate(async (id) => (await chrome.bookmarks.getChildren(id)).map((node) => node.title), id);

test('saves the current page into a category, and an open new tab shows it', async ({ dashboard, popup }) => {
  const ids = await addBookmarks(dashboard, sample);
  const page = await popup(gitlab);
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Explore · GitLab');
  await expect(page.getByRole('textbox', { name: 'URL' })).toHaveValue('https://gitlab.com/explore');

  await page.getByRole('textbox', { name: 'Title' }).fill('GitLab');
  await page.getByRole('combobox', { name: 'Category' }).selectOption({ label: 'Docs' });
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText(/Saved to Work › Docs/);

  expect(await childTitles(dashboard, ids['Docs']!)).toEqual(['GitLab']);
  await expect(dashboard.getByRole('list', { name: 'Links in Docs' }).getByRole('link', { name: 'GitLab' })).toBeVisible();
});

test('opens on the last used category, and says where a page is already saved', async ({ dashboard, popup }) => {
  await addBookmarks(dashboard, sample);
  const first = await popup(gitlab);
  await first.getByRole('combobox', { name: 'Category' }).selectOption({ label: 'Media' });
  await first.getByRole('button', { name: 'Save' }).click();
  await expect(first.getByRole('status')).toHaveText(/Saved to Home › Media/);

  const second = await popup({ url: 'https://github.com/', title: 'GitHub' });
  await expect(second.getByRole('combobox', { name: 'Category' }).locator('option:checked')).toHaveText('Media');
  await expect(second.getByText('Already in Work › Repos')).toBeVisible();
});

test('only offers to save web pages', async ({ dashboard, popup }) => {
  await addBookmarks(dashboard, sample);
  const page = await popup({ url: 'chrome://settings/', title: 'Settings' });
  await expect(page.getByText('Only web pages can be saved.')).toBeVisible();
  await expect(page.getByRole('form')).toHaveCount(0);
});

test('asks for a category first when there are none', async ({ dashboard, popup }) => {
  await addBookmarks(dashboard, [{ title: 'Work', children: [] }]);
  const page = await popup(gitlab);
  await expect(page.getByText('Create a category on the new tab page first, then save pages into it.')).toBeVisible();
});

test('opens in the saved theme', async ({ dashboard, popup }) => {
  await addBookmarks(dashboard, sample);
  await dashboard.getByRole('button', { name: 'Settings' }).click();
  await dashboard.getByRole('radio', { name: 'Dracula' }).check();
  const page = await popup(gitlab);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');
});
