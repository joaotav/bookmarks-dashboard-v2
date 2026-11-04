import { addBookmarks, expect, test, type Seed } from './fixtures';

const sample: Seed[] = [
  {
    title: 'Work',
    children: [
      { title: 'Repos', children: [{ title: 'GitHub', url: 'https://github.com/' }] },
      { title: 'Docs', children: [{ title: 'MDN', url: 'https://developer.mozilla.org/' }] },
    ],
  },
  { title: 'Home', children: [{ title: 'Media', children: [{ title: 'YouTube', url: 'https://www.youtube.com/' }] }] },
];

test('collapses a category and keeps it collapsed in new tabs', async ({ dashboard, newTab }) => {
  await addBookmarks(dashboard, sample);
  const repos = dashboard.getByRole('button', { name: /^Repos/ });
  await repos.click();
  await expect(repos).toHaveAttribute('aria-expanded', 'false');
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toHaveCount(0);
  await expect(dashboard.getByRole('link', { name: 'MDN' })).toBeVisible();

  const later = await newTab();
  await expect(later.getByRole('button', { name: /^Repos/ })).toHaveAttribute('aria-expanded', 'false');
  await expect(later.getByRole('link', { name: 'MDN' })).toBeVisible();

  await later.getByRole('button', { name: /^Repos/ }).click();
  await expect(later.getByRole('link', { name: 'GitHub' })).toBeVisible();
});

test('a collapse in one open tab shows up in the others', async ({ dashboard, newTab }) => {
  await addBookmarks(dashboard, sample);
  const other = await newTab();
  await expect(other.getByRole('link', { name: 'MDN' })).toBeVisible();

  await dashboard.getByRole('button', { name: /^Docs/ }).click();
  await expect(other.getByRole('button', { name: /^Docs/ })).toHaveAttribute('aria-expanded', 'false');
  await expect(other.getByRole('link', { name: 'MDN' })).toHaveCount(0);
});

test('collapse all and expand all only change the open space', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  const headers = dashboard.locator('.card h2 button');

  await dashboard.getByRole('button', { name: 'Collapse all' }).click();
  await expect(headers).toHaveCount(2);
  for (const header of await headers.all()) await expect(header).toHaveAttribute('aria-expanded', 'false');

  await dashboard.getByRole('tab', { name: 'Home' }).click();
  await expect(dashboard.getByRole('link', { name: 'YouTube' })).toBeVisible();
  await dashboard.getByRole('button', { name: 'Collapse all' }).click();
  await expect(dashboard.getByRole('link', { name: 'YouTube' })).toHaveCount(0);

  await dashboard.getByRole('tab', { name: 'Work' }).click();
  await dashboard.getByRole('button', { name: 'Expand all' }).click();
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toBeVisible();
  await expect(dashboard.getByRole('link', { name: 'MDN' })).toBeVisible();

  await dashboard.getByRole('tab', { name: 'Home' }).click();
  await expect(dashboard.getByRole('link', { name: 'YouTube' })).toHaveCount(0);
});

test('works from the keyboard', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  const repos = dashboard.getByRole('button', { name: /^Repos/ });
  await repos.focus();
  await dashboard.keyboard.press('Enter');
  await expect(repos).toHaveAttribute('aria-expanded', 'false');
  await dashboard.keyboard.press('Space');
  await expect(repos).toHaveAttribute('aria-expanded', 'true');
});
