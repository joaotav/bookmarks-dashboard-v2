import { addBookmarks, expect, test, type Seed } from './fixtures';

const sample: Seed[] = [
  {
    title: '💼 Work',
    children: [
      { title: 'Loose link', url: 'https://example.com/loose' },
      { title: 'Repos', children: [{ title: 'GitHub', url: 'https://github.com/' }] },
      { title: 'Docs', children: [{ title: 'MDN', url: 'https://developer.mozilla.org/' }] },
    ],
  },
  { title: 'Home', children: [{ title: 'Media', children: [{ title: 'YouTube', url: 'https://www.youtube.com/' }] }] },
];

test('creates the Workspace folder in Other bookmarks on first run, once', async ({ dashboard }) => {
  const countWorkspaces = () =>
    dashboard.evaluate(async () => {
      const [root] = await chrome.bookmarks.getTree();
      const other = root!.children!.find((folder) => folder.folderType === 'other')!;
      return other.children!.filter((node) => node.title === 'Workspace' && !node.url).length;
    });
  expect(await countWorkspaces()).toBe(1);
  await dashboard.reload();
  await expect(dashboard.getByText('Your workspace is empty.')).toBeVisible();
  expect(await countWorkspaces()).toBe(1);
});

test('shows spaces as tabs and their folders as cards', async ({ dashboard }) => {
  await addBookmarks(dashboard, sample);
  await expect(dashboard.getByRole('tab')).toHaveText([/💼\s*Work/, /Home/]);
  await expect(dashboard.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true');
  // Links directly in the space come first, in an "Unsorted" card.
  await expect(dashboard.getByRole('heading', { level: 2 })).toHaveText([/Unsorted\s*1/, /Repos\s*1/, /Docs\s*1/]);
  await expect(dashboard.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/');

  await dashboard.getByRole('tab', { name: 'Home' }).click();
  await expect(dashboard.getByRole('heading', { level: 2 })).toHaveText([/Media\s*1/]);
});

test('follows bookmark changes made elsewhere without reloading', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await expect(dashboard.getByRole('link', { name: 'MDN' })).toBeVisible();

  await addBookmarks(dashboard, [{ title: 'Svelte', url: 'https://svelte.dev/' }], ids['Docs']);
  await expect(dashboard.getByRole('link', { name: 'Svelte' })).toBeVisible();

  await dashboard.evaluate(async (id) => void (await chrome.bookmarks.update(id, { title: 'Hub' })), ids['GitHub']!);
  await expect(dashboard.getByRole('link', { name: 'Hub' })).toBeVisible();

  await dashboard.evaluate(async (id) => chrome.bookmarks.removeTree(id), ids['Docs']!);
  await expect(dashboard.getByRole('heading', { name: /Docs/ })).toHaveCount(0);
});

test('remembers the open space, and falls back to the first one if it is deleted', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await dashboard.getByRole('tab', { name: 'Home' }).click();
  await dashboard.reload();
  await expect(dashboard.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');

  await dashboard.evaluate(async (id) => chrome.bookmarks.removeTree(id), ids['Home']!);
  await expect(dashboard.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'true');
});

test('puts links directly in Workspace in an extra Unsorted space', async ({ dashboard }) => {
  await addBookmarks(dashboard, [...sample, { title: 'Stray', url: 'https://stray.example/' }]);
  await expect(dashboard.getByRole('tab')).toHaveText([/💼\s*Work/, /Home/, /Unsorted/]);
  await dashboard.getByRole('tab', { name: 'Unsorted' }).click();
  await expect(dashboard.getByRole('link', { name: 'Stray' })).toBeVisible();
});

test('offers to create a category when a space has none', async ({ dashboard }) => {
  await addBookmarks(dashboard, [{ title: 'Empty space', children: [] }]);
  await expect(dashboard.getByRole('button', { name: '+ New category' })).toBeVisible();
  await expect(dashboard.getByRole('heading', { level: 2 })).toHaveCount(0);
});

test('never runs bookmarks that are not web links, and shows titles as text', async ({ dashboard }) => {
  const dialogs: string[] = [];
  dashboard.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });
  await addBookmarks(dashboard, [
    {
      title: 'Work',
      children: [
        {
          title: 'Odd',
          children: [
            { title: 'Bookmarklet', url: 'javascript:alert(1)' },
            { title: '<img src=x onerror=alert(2)>', url: 'https://example.com/' },
          ],
        },
      ],
    },
  ]);
  const bookmarklet = dashboard.getByText('Bookmarklet');
  await expect(bookmarklet).toBeVisible();
  await expect(dashboard.locator('[href^="javascript:"]')).toHaveCount(0);
  await bookmarklet.click();
  await expect(dashboard.getByRole('link', { name: '<img src=x onerror=alert(2)>' })).toBeVisible();
  expect(dialogs).toEqual([]);
});
