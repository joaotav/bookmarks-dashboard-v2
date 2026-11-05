import type { BrowserContext } from '@playwright/test';
import { addBookmarks, expect, test, type Seed } from './fixtures';

// Opened links get a stub page instead of the real sites, so the tests don't need a network.
test.beforeEach(async ({ context }) => {
  await context.route(/^https?:/, (route) => route.fulfill({ body: 'ok', contentType: 'text/plain' }));
});

const sample: Seed[] = [
  {
    title: '💼 Work',
    children: [
      { title: 'Repos', children: [{ title: 'GitHub', url: 'https://github.com/' }, { title: 'GitLab', url: 'https://gitlab.com/' }] },
    ],
  },
  { title: 'Home', children: [{ title: 'Media', children: [{ title: 'YouTube', url: 'https://www.youtube.com/' }] }] },
];

const webPages = (context: BrowserContext) =>
  context
    .pages()
    .map((page) => page.url())
    .filter((url) => url.startsWith('http'));

test('"/" focuses the search, which finds links in other spaces and in collapsed categories', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  await dashboard.getByRole('button', { name: /^Repos/ }).click();
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toBeHidden();

  // A new tab starts with focus in the address bar. Clicking the page gives it focus.
  await dashboard.locator('main').click();
  await dashboard.keyboard.press('/');
  const box = dashboard.getByRole('combobox', { name: 'Search all spaces' });
  await expect(box).toBeFocused();
  await expect(box).toHaveValue('');

  await dashboard.keyboard.type('gthb');
  await expect(dashboard.getByRole('option')).toHaveText([/GitHub\s*Work › Repos · github\.com/]);
  await box.fill('tube');
  await expect(dashboard.getByRole('option')).toHaveText([/YouTube\s*Home › Media · youtube\.com/]);
});

test('Enter opens the selected link in this tab', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  await dashboard.getByRole('combobox', { name: 'Search all spaces' }).fill('git');
  await dashboard.keyboard.press('ArrowDown');
  await expect(dashboard.getByRole('option', { selected: true })).toHaveText(/GitLab/);
  await dashboard.keyboard.press('Enter');
  await expect(dashboard).toHaveURL('https://gitlab.com/');
});

test('Ctrl+Enter opens it in a background tab and keeps the search', async ({ context, dashboard }) => {
  await addBookmarks(dashboard, sample);
  const box = dashboard.getByRole('combobox', { name: 'Search all spaces' });
  await box.fill('youtube');
  await dashboard.keyboard.press('Control+Enter');
  await expect.poll(() => webPages(context)).toEqual(['https://www.youtube.com/']);
  await expect(box).toHaveValue('youtube');
  await expect(dashboard.getByRole('option')).toHaveCount(1);
});

test('Escape clears the search', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  const box = dashboard.getByRole('combobox', { name: 'Search all spaces' });
  await box.fill('git');
  await expect(dashboard.getByRole('listbox')).toBeVisible();
  await dashboard.keyboard.press('Escape');
  await expect(box).toHaveValue('');
  await expect(dashboard.getByRole('listbox')).toBeHidden();
});
