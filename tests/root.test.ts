import { describe, expect, it } from 'vitest';
import type { BookmarkNode } from '@/lib/node';
import { pickOtherBookmarksFolder } from '@/lib/root';

const folder = (id: string, extra: Partial<BookmarkNode> = {}): BookmarkNode => ({ id, title: id, children: [], ...extra });

describe('pickOtherBookmarksFolder', () => {
  it('picks unfiled_____ on Firefox', () => {
    const root = folder('root________', {
      children: ['menu________', 'toolbar_____', 'unfiled_____', 'mobile______'].map((id) => folder(id, { type: 'folder' })),
    });
    expect(pickOtherBookmarksFolder(root)).toBe('unfiled_____');
  });

  it('picks the folder typed "other" on Chrome 134+', () => {
    const root = folder('0', {
      children: [
        folder('1', { folderType: 'bookmarks-bar', syncing: false }),
        folder('2', { folderType: 'other', syncing: false }),
        folder('3', { folderType: 'mobile', syncing: false }),
      ],
    });
    expect(pickOtherBookmarksFolder(root)).toBe('2');
  });

  it('prefers the synced account copy when Chrome has local and account folders', () => {
    const root = folder('0', {
      children: [
        folder('1', { folderType: 'bookmarks-bar', syncing: false }),
        folder('2', { folderType: 'other', syncing: false }),
        folder('4', { folderType: 'bookmarks-bar', syncing: true }),
        folder('5', { folderType: 'other', syncing: true }),
      ],
    });
    expect(pickOtherBookmarksFolder(root)).toBe('5');
  });

  it('falls back to the second root folder on Chrome before 134', () => {
    const root = folder('0', { children: [folder('1'), folder('2'), folder('3')] });
    expect(pickOtherBookmarksFolder(root)).toBe('2');
  });

  it('throws when the tree has no folders', () => {
    expect(() => pickOtherBookmarksFolder(folder('0'))).toThrow();
  });
});
