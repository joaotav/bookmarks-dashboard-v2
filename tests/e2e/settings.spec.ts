import type { Page } from '@playwright/test';
import { addBookmarks, expect, test, type Seed } from './fixtures';

const sample: Seed[] = [
  {
    title: 'Work',
    children: [
      { title: 'Repos', children: [{ title: 'GitHub', url: 'https://github.com/' }] },
      {
        title: 'Docs',
        children: [{ title: 'A guide with a title long enough to need more than one line', url: 'https://example.com/guide' }],
      },
    ],
  },
];

const choose = async (page: Page, option: string) => {
  const panel = page.getByRole('dialog', { name: 'Display settings' });
  if (!(await panel.isVisible())) await page.getByRole('button', { name: 'Settings' }).click();
  await panel.getByRole('radio', { name: option }).check();
};

const attributes = (page: Page) => page.evaluate(() => ({ ...document.documentElement.dataset }));
const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const height = async (page: Page, link: string) => (await page.getByRole('link', { name: link }).boundingBox())!.height;

test('starts with the default settings', async ({ dashboard }) => {
  expect(await attributes(dashboard)).toEqual({
    layout: 'grid',
    theme: 'neutral-dark',
    density: 'comfortable',
    titles: 'one-line',
    sizing: 'fit-content',
  });
  expect(await background(dashboard)).toBe('rgb(28, 29, 34)');
});

test('keeps every changed setting in new tabs', async ({ dashboard, newTab }) => {
  await addBookmarks(dashboard, sample);
  for (const option of ['Rosé Pine Dawn', 'Compact', 'Title and URL', 'Fixed']) await choose(dashboard, option);
  const changed = { layout: 'grid', theme: 'rose-pine-dawn', density: 'compact', titles: 'with-url', sizing: 'fixed' };
  expect(await attributes(dashboard)).toEqual(changed);

  const later = await newTab();
  await expect(later.getByRole('link', { name: 'GitHub' })).toBeVisible();
  expect(await attributes(later)).toEqual(changed);
  expect(await background(later)).toBe('rgb(250, 244, 237)');
  await later.getByRole('button', { name: 'Settings' }).click();
  for (const option of ['Grid', 'Rosé Pine Dawn', 'Compact', 'Title and URL', 'Fixed']) {
    await expect(later.getByRole('radio', { name: option })).toBeChecked();
  }
});

test('new tabs start with the saved theme instead of flashing the default', async ({ context, dashboard, newTab }) => {
  await choose(dashboard, 'Dracula');
  // Records the theme when the page has run its scripts, before storage.sync can answer.
  await context.addInitScript(() =>
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { themeAtLoad?: string }).themeAtLoad = document.documentElement.dataset.theme;
    }),
  );
  const later = await newTab();
  await expect(later.locator('html')).toHaveAttribute('data-theme', 'dracula');
  expect(await later.evaluate(() => (window as unknown as { themeAtLoad?: string }).themeAtLoad)).toBe('dracula');
});

test('a change in one open tab shows up in the others', async ({ dashboard, newTab }) => {
  const other = await newTab();
  await expect(other.getByText('Your workspace is empty.')).toBeVisible();
  await choose(dashboard, 'Dracula');
  await expect(other.locator('html')).toHaveAttribute('data-theme', 'dracula');
  expect(await background(other)).toBe('rgb(33, 34, 44)');
});

test('density, titles and sizing change the cards', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  const guide = 'A guide with a title long enough to need more than one line';
  const cards = dashboard.locator('.card');
  await expect(cards).toHaveCount(2);
  const widths = async () => Promise.all((await cards.all()).map(async (card) => (await card.boundingBox())!.width));

  // Fit content: the card with the long title is wider.
  const [repos, docs] = await widths();
  expect(docs!).toBeGreaterThan(repos!);
  await choose(dashboard, 'Fixed');
  const [fixedRepos, fixedDocs] = await widths();
  expect(fixedDocs).toBe(fixedRepos);

  expect(await height(dashboard, 'GitHub')).toBe(34);
  await choose(dashboard, 'Compact');
  expect(await height(dashboard, 'GitHub')).toBe(26);

  // The long title wraps onto a second line, the short one doesn't.
  await choose(dashboard, 'Up to two lines');
  expect(await height(dashboard, guide)).toBeGreaterThan(await height(dashboard, 'GitHub'));

  await expect(dashboard.getByText('github.com/')).toBeHidden();
  await choose(dashboard, 'Title and URL');
  await expect(dashboard.getByText('github.com/')).toBeVisible();
});

test('the settings panel closes on Escape and on a click outside', async ({ dashboard }) => {
  const panel = dashboard.getByRole('dialog', { name: 'Display settings' });
  await dashboard.getByRole('button', { name: 'Settings' }).click();
  await expect(panel).toBeVisible();
  await dashboard.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(dashboard.getByRole('button', { name: 'Settings' })).toBeFocused();

  await dashboard.getByRole('button', { name: 'Settings' }).click();
  await dashboard.locator('main').click();
  await expect(panel).toBeHidden();
});
