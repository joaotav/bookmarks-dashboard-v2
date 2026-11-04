import type { Page } from '@playwright/test';
import { addBookmarks, expect, test, type Seed } from './fixtures';

const sample: Seed[] = [
  {
    title: 'Work',
    children: [
      { title: 'Loose link', url: 'https://example.com/loose' },
      { title: 'Repos', children: [{ title: 'GitHub', url: 'https://github.com/' }] },
    ],
  },
];

/** The bookmark as the browser's bookmark manager sees it. */
const bookmark = (page: Page, id: string) => page.evaluate(async (id) => (await chrome.bookmarks.get(id))[0]!, id);

/** Titles of the folders and links directly in a folder, in order. */
const childTitles = (page: Page, id: string) =>
  page.evaluate(async (id) => (await chrome.bookmarks.getChildren(id)).map((node) => node.title), id);

const workspaceId = (page: Page) =>
  page.evaluate(async () => (await chrome.storage.local.get('workspaceRootId')).workspaceRootId as string);

test('creates a space with an icon from the + button', async ({ dashboard }) => {
  await dashboard.getByRole('button', { name: 'New space' }).click();
  const form = dashboard.getByRole('form', { name: 'New space' });
  await form.getByRole('textbox', { name: 'Space name' }).fill('Launch');
  await form.getByRole('radio', { name: '🚀' }).check();
  await form.getByRole('button', { name: 'Save' }).click();

  await expect(form).toBeHidden();
  await expect(dashboard.getByRole('tab', { name: /Launch/ })).toHaveAttribute('aria-selected', 'true');
  expect(await childTitles(dashboard, await workspaceId(dashboard))).toEqual(['🚀 Launch']);
});

test('takes any emoji typed into the space form', async ({ dashboard }) => {
  await dashboard.getByRole('button', { name: 'New space' }).click();
  const form = dashboard.getByRole('form', { name: 'New space' });
  await form.getByRole('textbox', { name: 'Other emoji' }).fill('🦀');
  await expect(form.getByRole('radio', { name: '🦀' })).toBeChecked();
  await form.getByRole('textbox', { name: 'Space name' }).fill('Rust');
  await form.getByRole('textbox', { name: 'Space name' }).press('Enter');
  await expect(dashboard.getByRole('tab', { name: /Rust/ })).toBeVisible();
  expect(await childTitles(dashboard, await workspaceId(dashboard))).toEqual(['🦀 Rust']);
});

test('renames a space and changes its icon, or cancels with Escape', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, [{ title: '💼 Work', children: [] }]);
  await expect(dashboard.getByRole('tab', { name: /Work/ })).toBeVisible();

  await dashboard.getByRole('button', { name: 'Actions for space Work' }).click();
  await dashboard.getByRole('button', { name: 'Rename' }).click();
  const form = dashboard.getByRole('form', { name: 'Rename space' });
  await expect(form.getByRole('textbox', { name: 'Space name' })).toHaveValue('Work');
  await expect(form.getByRole('radio', { name: '💼' })).toBeChecked();
  await form.getByRole('textbox', { name: 'Space name' }).fill('Job');
  await dashboard.keyboard.press('Escape');
  await expect(form).toBeHidden();
  expect((await bookmark(dashboard, ids['💼 Work']!)).title).toBe('💼 Work');

  await dashboard.getByRole('button', { name: 'Actions for space Work' }).click();
  await dashboard.getByRole('button', { name: 'Rename' }).click();
  await form.getByRole('textbox', { name: 'Space name' }).fill('Job');
  await form.getByRole('radio', { name: 'No icon' }).check();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(dashboard.getByRole('tab', { name: 'Job' })).toBeVisible();
  expect((await bookmark(dashboard, ids['💼 Work']!)).title).toBe('Job');
});

test('creates a category and adds links to it', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, [{ title: 'Work', children: [] }]);
  await dashboard.getByRole('button', { name: '+ New category' }).click();
  await dashboard.getByRole('textbox', { name: 'Category name' }).fill('Reading');
  await dashboard.keyboard.press('Enter');
  await expect(dashboard.getByRole('heading', { level: 2 })).toHaveText([/Reading\s*0/]);
  expect(await childTitles(dashboard, ids['Work']!)).toEqual(['Reading']);

  // Without a title, the link is named after its hostname.
  await dashboard.getByRole('button', { name: '+ Add bookmark' }).click();
  await dashboard.getByRole('textbox', { name: 'URL' }).fill('www.example.com/article');
  await dashboard.keyboard.press('Enter');
  await expect(dashboard.getByRole('link', { name: 'example.com' })).toHaveAttribute('href', 'https://www.example.com/article');

  await dashboard.getByRole('button', { name: '+ Add bookmark' }).click();
  await dashboard.getByRole('textbox', { name: 'URL' }).fill('https://svelte.dev/docs');
  await dashboard.getByRole('textbox', { name: 'Title' }).fill('Svelte docs');
  await dashboard.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dashboard.getByRole('link').nth(0)).toHaveAccessibleName('example.com');
  await expect(dashboard.getByRole('link').nth(1)).toHaveAccessibleName('Svelte docs');
});

test('refuses to add an address that is not a web page', async ({ dashboard }) => {
  await addBookmarks(dashboard, [{ title: 'Work', children: [{ title: 'Repos', children: [] }] }]);
  await dashboard.getByRole('button', { name: '+ Add bookmark' }).click();
  await dashboard.getByRole('textbox', { name: 'URL' }).fill('javascript:alert(1)');
  await dashboard.keyboard.press('Enter');
  await expect(dashboard.getByText('Enter a web address, like example.com')).toHaveRole('alert');
  await dashboard.keyboard.press('Escape');
  await expect(dashboard.getByRole('textbox', { name: 'URL' })).toBeHidden();
  await expect(dashboard.getByRole('link')).toHaveCount(0);
});

test('renames categories and links inline, and the bookmark manager shows it', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await dashboard.getByRole('button', { name: 'Actions for Repos' }).click();
  await dashboard.getByRole('button', { name: 'Rename' }).click();
  await dashboard.getByRole('textbox', { name: 'Category name' }).fill('Code');
  await dashboard.keyboard.press('Enter');
  await expect(dashboard.getByRole('heading', { name: /^Code/ })).toBeVisible();
  expect((await bookmark(dashboard, ids['Repos']!)).title).toBe('Code');

  await dashboard.getByRole('link', { name: 'GitHub' }).hover();
  await dashboard.getByRole('button', { name: 'Actions for GitHub' }).click();
  await dashboard.getByRole('button', { name: 'Rename' }).click();
  await dashboard.getByRole('textbox', { name: 'Title' }).fill('GitHub home');
  await dashboard.keyboard.press('Enter');
  await expect(dashboard.getByRole('link', { name: 'GitHub home' })).toBeVisible();
  expect((await bookmark(dashboard, ids['GitHub']!)).title).toBe('GitHub home');
});

test('a link renamed to nothing goes back to its default title', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await dashboard.getByRole('button', { name: 'Actions for GitHub' }).click();
  await dashboard.getByRole('button', { name: 'Rename' }).click();
  await dashboard.getByRole('textbox', { name: 'Title' }).clear();
  await dashboard.keyboard.press('Enter');
  await expect(dashboard.getByRole('link', { name: 'github.com' })).toBeVisible();
  expect((await bookmark(dashboard, ids['GitHub']!)).title).toBe('github.com');
});

test('edits a link\'s URL, and Escape leaves it unchanged', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  const editUrl = async () => {
    await dashboard.getByRole('button', { name: 'Actions for GitHub' }).click();
    await dashboard.getByRole('button', { name: 'Edit URL' }).click();
    return dashboard.getByRole('textbox', { name: 'URL' });
  };

  const field = await editUrl();
  await expect(field).toHaveValue('https://github.com/');
  await field.fill('https://example.org/');
  await field.press('Escape');
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/');

  await (await editUrl()).fill('mailto:me@example.com');
  await dashboard.keyboard.press('Enter');
  await expect(dashboard.getByText('Enter a web address, like example.com')).toHaveRole('alert');
  await dashboard.getByRole('textbox', { name: 'URL' }).fill('github.com/sveltejs');
  await dashboard.keyboard.press('Enter');
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/sveltejs');
  expect((await bookmark(dashboard, ids['GitHub']!)).url).toBe('https://github.com/sveltejs');
});

test('the Unsorted card and tab cannot be renamed', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  await expect(dashboard.getByRole('heading', { name: /^Unsorted/ })).toBeVisible();
  await dashboard.getByRole('button', { name: 'Actions for Unsorted' }).click();
  await expect(dashboard.getByRole('button', { name: 'Open all bookmarks' })).toBeVisible();
  await expect(dashboard.getByRole('button', { name: 'Rename' })).toHaveCount(0);
  await dashboard.keyboard.press('Escape');
  await expect(dashboard.getByRole('button', { name: 'Actions for Loose link' })).toHaveCount(1);

  await addBookmarks(dashboard, [{ title: 'Stray', url: 'https://example.com/stray' }]);
  await dashboard.getByRole('tab', { name: 'Unsorted' }).click();
  await expect(dashboard.getByRole('link', { name: 'Stray' })).toBeVisible();
  await expect(dashboard.getByRole('button', { name: /Actions for space/ })).toHaveCount(0);
  await expect(dashboard.getByRole('button', { name: '+ New category' })).toHaveCount(0);
});
