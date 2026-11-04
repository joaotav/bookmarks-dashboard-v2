import type { Page } from '@playwright/test';
import { addBookmarks, expect, test, type Seed } from './fixtures';

const sample: Seed[] = [
  {
    title: '💼 Work',
    children: [
      {
        title: 'Repos',
        children: [
          { title: 'GitHub', url: 'https://github.com/' },
          // A folder inside a category, made in the browser's bookmark manager.
          { title: 'Old', children: [{ title: 'GitLab', url: 'https://gitlab.com/' }] },
          { title: 'Codeberg', url: 'https://codeberg.org/' },
        ],
      },
      { title: 'Docs', children: [{ title: 'MDN', url: 'https://developer.mozilla.org/' }] },
    ],
  },
  { title: 'Home', children: [{ title: 'Media', children: [{ title: 'YouTube', url: 'https://www.youtube.com/' }] }] },
];

/** A folder's contents as nested titles, as the browser's bookmark manager sees them. */
const tree = (page: Page, id: string) =>
  page.evaluate(async (id) => {
    type Node = { title: string; children?: Node[] };
    const shape = (node: Node): unknown => (node.children ? [node.title, node.children.map(shape)] : node.title);
    return shape((await chrome.bookmarks.getSubTree(id))[0]!);
  }, id);

const deleteFrom = async (page: Page, menu: string) => {
  await page.getByRole('button', { name: menu }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
};

test('deletes a category with nested links, and undo brings back its structure and collapse state', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  const before = await tree(dashboard, ids['💼 Work']!);
  await dashboard.getByRole('button', { name: /^Repos/ }).click();
  await expect(dashboard.getByRole('button', { name: /^Repos/ })).toHaveAttribute('aria-expanded', 'false');

  await deleteFrom(dashboard, 'Actions for Repos');
  await expect(dashboard.getByRole('heading', { level: 2 })).toHaveText([/Docs/]);
  await expect(dashboard.getByRole('status')).toHaveText(/Deleted “Repos”/);
  expect(await tree(dashboard, ids['💼 Work']!)).toEqual(['💼 Work', [['Docs', ['MDN']]]]);

  await dashboard.getByRole('button', { name: 'Undo' }).click();
  await expect(dashboard.getByRole('status')).toBeHidden();
  await expect(dashboard.getByRole('heading', { level: 2 })).toHaveText([/Repos\s*3/, /Docs/]);
  expect(await tree(dashboard, ids['💼 Work']!)).toEqual(before);
  await expect(dashboard.getByRole('button', { name: /^Repos/ })).toHaveAttribute('aria-expanded', 'false');

  // The restored folders are new bookmarks, so collapse state follows the new IDs.
  await dashboard.getByRole('button', { name: /^Repos/ }).click();
  await expect(dashboard.getByRole('link', { name: 'GitLab' })).toBeVisible();
});

test('deletes a link, and undo puts it back in its place', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await deleteFrom(dashboard, 'Actions for GitHub');
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toHaveCount(0);
  expect(await tree(dashboard, ids['Repos']!)).toEqual(['Repos', [['Old', ['GitLab']], 'Codeberg']]);

  await dashboard.getByRole('button', { name: 'Undo' }).click();
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toBeVisible();
  expect(await tree(dashboard, ids['Repos']!)).toEqual(['Repos', ['GitHub', ['Old', ['GitLab']], 'Codeberg']]);
});

test('deletes a space, and undo opens it again', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  await deleteFrom(dashboard, 'Actions for space Work');
  await expect(dashboard.getByRole('tab')).toHaveText(['Home']);
  await expect(dashboard.getByRole('status')).toHaveText(/Deleted space “💼 Work”/);

  await dashboard.getByRole('button', { name: 'Undo' }).click();
  await expect(dashboard.getByRole('tab')).toHaveText([/💼\s*Work/, /Home/]);
  await expect(dashboard.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true');
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toBeVisible();
});

test('only the most recent delete can be undone', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  await deleteFrom(dashboard, 'Actions for MDN');
  await deleteFrom(dashboard, 'Actions for Codeberg');
  await expect(dashboard.getByRole('status')).toHaveText(/Deleted “Codeberg”/);
  await dashboard.getByRole('button', { name: 'Undo' }).click();
  await expect(dashboard.getByRole('link', { name: 'Codeberg' })).toBeVisible();
  await expect(dashboard.getByRole('link', { name: 'MDN' })).toHaveCount(0);
});
