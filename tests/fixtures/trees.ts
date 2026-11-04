import type { BookmarkNode } from '@/lib/node';

export const folder = (id: string, title: string, children: BookmarkNode[] = [], extra: Partial<BookmarkNode> = {}): BookmarkNode => ({
  id,
  title,
  children,
  ...extra,
});
export const link = (id: string, title: string, url: string): BookmarkNode => ({ id, title, url });
export const separator = (id: string): BookmarkNode => ({ id, title: '', url: 'data:', type: 'separator' });

/** Firefox's bookmark tree: fixed IDs ending in underscores and `type` on every node. */
export const firefoxRoot = (): BookmarkNode =>
  folder(
    'root________',
    '',
    [
      folder('menu________', 'Bookmarks Menu', [], { type: 'folder' }),
      folder('toolbar_____', 'Bookmarks Toolbar', [], { type: 'folder' }),
      folder('unfiled_____', 'Other Bookmarks', [], { type: 'folder' }),
      folder('mobile______', 'Mobile Bookmarks', [], { type: 'folder' }),
    ],
    { type: 'folder' },
  );

/**
 * Chrome 134+'s bookmark tree. Signed in with bookmark sync, it has a second set of
 * permanent folders for the account, marked `syncing`.
 */
export const chromeRoot = ({ account = false } = {}): BookmarkNode =>
  folder('0', '', [
    folder('1', 'Bookmarks bar', [], { folderType: 'bookmarks-bar', syncing: false }),
    folder('2', 'Other bookmarks', [], { folderType: 'other', syncing: false }),
    folder('3', 'Mobile bookmarks', [], { folderType: 'mobile', syncing: false }),
    ...(account
      ? [
          folder('4', 'Bookmarks bar', [], { folderType: 'bookmarks-bar', syncing: true }),
          folder('5', 'Other bookmarks', [], { folderType: 'other', syncing: true }),
          folder('6', 'Mobile bookmarks', [], { folderType: 'mobile', syncing: true }),
        ]
      : []),
  ]);

/** Chrome before 134: no `folderType`, so the folders are only known by position. */
export const legacyChromeRoot = (): BookmarkNode =>
  folder('0', '', [folder('1', 'Bookmarks bar'), folder('2', 'Other bookmarks'), folder('3', 'Mobile bookmarks')]);
