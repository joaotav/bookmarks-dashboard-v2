import type { Locator, Page } from '@playwright/test';
import { addBookmarks, expect, test, type Seed } from './fixtures';

const sample: Seed[] = [
  {
    title: 'Work',
    children: [
      {
        title: 'Repos',
        children: [
          { title: 'GitHub', url: 'https://github.com/' },
          { title: 'GitLab', url: 'https://gitlab.com/' },
          { title: 'Codeberg', url: 'https://codeberg.org/' },
        ],
      },
      { title: 'Docs', children: [{ title: 'MDN', url: 'https://developer.mozilla.org/' }] },
      { title: 'Empty', children: [] },
    ],
  },
];

/** Titles of the folders and links directly in a folder, as the browser's bookmark manager shows them. */
const childTitles = (page: Page, id: string) =>
  page.evaluate(async (id) => (await chrome.bookmarks.getChildren(id)).map((node) => node.title), id);

/** Expects a card to show these links, in order. A link's text starts with its title, then its hidden URL. */
const expectLinks = (page: Page, card: string, titles: string[]) =>
  expect(page.getByRole('list', { name: `Links in ${card}` }).getByRole('link')).toHaveText(
    titles.map((title) => new RegExp(`^\\s*${title}`)),
  );

/** Presses a grip and moves the pointer in small steps to a point on `target`, then lets go. */
async function drag(page: Page, grip: Locator, target: Locator, { y = 0.5 } = {}) {
  await grip.hover();
  const from = (await grip.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  const x = to.x + to.width / 2;
  await page.mouse.move(x, to.y + to.height * y, { steps: 15 });
  // Other items slide aside while the drag goes on. A last small move once they've settled
  // makes the drop spot match what's under the pointer, as it does for a person.
  await page.waitForTimeout(200);
  await page.mouse.move(x, to.y + to.height * y + 1);
  await page.mouse.up();
}

const row = (page: Page, name: string) => page.getByRole('listitem', { name });
const grip = (page: Page, name: string) => page.getByRole('button', { name: `Move ${name}` });

test('moves a link down and up within its category, then into another one', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);

  await drag(dashboard, grip(dashboard, 'GitHub'), row(dashboard, 'Codeberg'));
  await expectLinks(dashboard, 'Repos', ['GitLab', 'Codeberg', 'GitHub']);
  await expect.poll(() => childTitles(dashboard, ids['Repos']!)).toEqual(['GitLab', 'Codeberg', 'GitHub']);

  await drag(dashboard, grip(dashboard, 'GitHub'), row(dashboard, 'GitLab'));
  await expectLinks(dashboard, 'Repos', ['GitHub', 'GitLab', 'Codeberg']);
  await expect.poll(() => childTitles(dashboard, ids['Repos']!)).toEqual(['GitHub', 'GitLab', 'Codeberg']);

  await drag(dashboard, grip(dashboard, 'GitLab'), row(dashboard, 'MDN'), { y: 0.25 });
  await expectLinks(dashboard, 'Repos', ['GitHub', 'Codeberg']);
  await expectLinks(dashboard, 'Docs', ['GitLab', 'MDN']);
  await expect.poll(() => childTitles(dashboard, ids['Docs']!)).toEqual(['GitLab', 'MDN']);
});

test('drops a link into an empty category', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await drag(dashboard, grip(dashboard, 'MDN'), dashboard.getByRole('list', { name: 'Links in Empty' }));
  await expectLinks(dashboard, 'Empty', ['MDN']);
  await expect(dashboard.getByText('No links yet')).toBeVisible();
  await expect.poll(() => childTitles(dashboard, ids['Empty']!)).toEqual(['MDN']);
  expect(await childTitles(dashboard, ids['Docs']!)).toEqual([]);
});

test('moves a link with the keyboard', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await grip(dashboard, 'GitHub').focus();
  await dashboard.keyboard.press('Space');
  await dashboard.keyboard.press('ArrowDown');
  await dashboard.keyboard.press('ArrowDown');
  await dashboard.keyboard.press('Space');
  await expectLinks(dashboard, 'Repos', ['GitLab', 'Codeberg', 'GitHub']);
  await expect.poll(() => childTitles(dashboard, ids['Repos']!)).toEqual(['GitLab', 'Codeberg', 'GitHub']);
});

/** Expects the active space to show these cards, in order. */
const expectCards = (page: Page, titles: string[]) =>
  expect(page.getByRole('heading', { level: 2 })).toHaveText(titles.map((title) => new RegExp(`^\\s*${title}`)));

test('moves a category, and Unsorted stays first', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await addBookmarks(dashboard, [{ title: 'Loose', url: 'https://example.com/' }], ids['Work']);
  await expectCards(dashboard, ['Unsorted', 'Repos', 'Docs', 'Empty']);

  await drag(dashboard, grip(dashboard, 'Repos'), dashboard.getByRole('heading', { name: /^Empty/ }));
  await expectCards(dashboard, ['Unsorted', 'Docs', 'Empty', 'Repos']);
  // The last category goes to the end of the space's folder, after the loose links.
  await expect.poll(() => childTitles(dashboard, ids['Work']!)).toEqual(['Docs', 'Empty', 'Loose', 'Repos']);

  // Dropped before Unsorted, it becomes the first category.
  await drag(dashboard, grip(dashboard, 'Empty'), dashboard.getByRole('heading', { name: /^Unsorted/ }));
  await expectCards(dashboard, ['Unsorted', 'Empty', 'Docs', 'Repos']);
  await expect.poll(() => childTitles(dashboard, ids['Work']!)).toEqual(['Empty', 'Docs', 'Loose', 'Repos']);
});

test('moves a category with the keyboard', async ({ dashboard }) => {
  const ids = await addBookmarks(dashboard, sample);
  await grip(dashboard, 'Docs').focus();
  await dashboard.keyboard.press('Space');
  await dashboard.keyboard.press('ArrowLeft');
  await dashboard.keyboard.press('Space');
  await expectCards(dashboard, ['Docs', 'Repos', 'Empty']);
  await expect.poll(() => childTitles(dashboard, ids['Work']!)).toEqual(['Docs', 'Repos', 'Empty']);
});

const spaces: Seed[] = [
  { title: 'Work', children: [] },
  { title: 'Home', children: [] },
  { title: 'Study', children: [] },
  { title: 'Loose', url: 'https://example.com/' },
];

const workspaceTitles = async (page: Page) =>
  childTitles(page, await page.evaluate(async () => (await chrome.storage.local.get('workspaceRootId')).workspaceRootId as string));

test('moves a space tab, and Unsorted stays last', async ({ dashboard }) => {
  await addBookmarks(dashboard, spaces);
  const tab = (name: string) => dashboard.getByRole('tab', { name });
  await expect(dashboard.getByRole('tab')).toHaveText([/Work/, /Home/, /Study/, /Unsorted/]);

  await drag(dashboard, tab('Study'), tab('Work'));
  await expect(dashboard.getByRole('tab')).toHaveText([/Study/, /Work/, /Home/, /Unsorted/]);
  await expect.poll(() => workspaceTitles(dashboard)).toEqual(['Study', 'Work', 'Home', 'Loose']);

  await drag(dashboard, tab('Study'), tab('Home'));
  await expect(dashboard.getByRole('tab')).toHaveText([/Work/, /Home/, /Study/, /Unsorted/]);
  await expect.poll(() => workspaceTitles(dashboard)).toEqual(['Work', 'Home', 'Loose', 'Study']);
});

test('moves a space tab with the keyboard, while Enter still selects', async ({ dashboard }) => {
  await addBookmarks(dashboard, spaces);
  const tab = (name: string) => dashboard.getByRole('tab', { name });
  await tab('Home').focus();
  await dashboard.keyboard.press('Enter');
  await expect(tab('Home')).toHaveAttribute('aria-selected', 'true');

  await dashboard.keyboard.press('Space');
  await dashboard.keyboard.press('ArrowRight');
  await dashboard.keyboard.press('Space');
  await expect(dashboard.getByRole('tab')).toHaveText([/Work/, /Study/, /Home/, /Unsorted/]);
  await expect.poll(() => workspaceTitles(dashboard)).toEqual(['Work', 'Study', 'Loose', 'Home']);
  await expect(tab('Home')).toHaveAttribute('aria-selected', 'true');
});
