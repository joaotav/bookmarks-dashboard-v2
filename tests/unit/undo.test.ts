import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getCollapsed, setCollapsed } from '@/lib/meta';
import type { BookmarkNode } from '@/lib/node';
import { remove, restore } from '@/lib/undo';
import { installFakeBookmarks } from '../fixtures/fake-bookmarks';
import { firefoxRoot, folder, link, separator } from '../fixtures/trees';

/** Titles of a subtree, nested the same way, so tests can compare structure but not IDs. */
const shape = (node: BookmarkNode): unknown => (node.children ? [node.title, node.children.map(shape)] : node.title);

const setup = () => {
  const root = firefoxRoot();
  root.children![1]!.children!.push(
    folder('w', 'Workspace', [
      folder('s1', 'Work', [
        link('loose', 'Loose', 'https://example.com/loose'),
        folder('c1', 'Repos', [
          link('l1', 'GitHub', 'https://github.com/'),
          separator('x1'),
          folder('sub', 'Old', [link('l2', 'GitLab', 'https://gitlab.com/')]),
        ]),
        folder('c2', 'Docs', [link('l3', 'MDN', 'https://developer.mozilla.org/')]),
      ]),
    ]),
  );
  return installFakeBookmarks(root);
};

beforeEach(() => fakeBrowser.reset());

describe('remove', () => {
  it('deletes a folder with everything in it, and returns where it was', async () => {
    const { find } = setup();
    const snapshot = await remove('c1');
    expect(find('c1')).toBeUndefined();
    expect(find('l2')).toBeUndefined();
    expect(snapshot).toMatchObject({ id: 'c1', parentId: 's1', index: 1 });
    expect(shape(snapshot)).toEqual(['Repos', ['GitHub', '', ['Old', ['GitLab']]]]);
  });

  it('deletes a single link', async () => {
    const { find } = setup();
    expect(await remove('l3')).toMatchObject({ id: 'l3', parentId: 'c2', index: 0, url: 'https://developer.mozilla.org/' });
    expect(find('c2')!.children).toEqual([]);
  });
});

describe('restore', () => {
  it('recreates a deleted folder at its old position, with nested folders and separators', async () => {
    const { find } = setup();
    const before = shape(find('s1')!);
    const newId = await restore(await remove('c1'));
    expect(shape(find('s1')!)).toEqual(before);
    expect(find('s1')!.children![1]!.id).toBe(newId);
    expect(find(newId)!.children![1]).toMatchObject({ type: 'separator' });
  });

  it('puts a link back between its old neighbours', async () => {
    const { find } = setup();
    await restore(await remove('loose'));
    expect(find('s1')!.children!.map((node) => node.title)).toEqual(['Loose', 'Repos', 'Docs']);
  });

  it('appends at the end when the old position no longer exists', async () => {
    const { find } = setup();
    const snapshot = await remove('c2');
    await remove('c1');
    await restore(snapshot);
    expect(find('s1')!.children!.map((node) => node.title)).toEqual(['Loose', 'Docs']);
  });

  it('moves collapsed state and icons to the new IDs', async () => {
    setup();
    await setCollapsed(['c1', 'sub', 'c2']);
    await fakeBrowser.storage.local.set({ 'icon:l1': 'https://github.com/favicon.ico' });
    const newId = await restore(await remove('c1'));

    const collapsed = await getCollapsed();
    expect(collapsed).toContain(newId);
    expect(collapsed).toContain('c2');
    expect(collapsed).not.toContain('c1');
    expect(collapsed).not.toContain('sub');
    expect(collapsed).toHaveLength(3);

    const icons = Object.entries(await fakeBrowser.storage.local.get()).filter(([key]) => key.startsWith('icon:'));
    expect(icons).toHaveLength(1);
    expect(icons[0]![0]).not.toBe('icon:l1');
    expect(icons[0]![1]).toBe('https://github.com/favicon.ico');
  });
});
