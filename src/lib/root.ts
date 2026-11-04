import type { BookmarkNode } from './node';

const FIREFOX_OTHER_BOOKMARKS_ID = 'unfiled_____';

/**
 * Returns the ID of the "Other Bookmarks" folder, where the Workspace folder is created.
 * Chrome 134+ marks it with `folderType` and can have both a local and an account copy,
 * in which case the synced account copy wins.
 */
export function pickOtherBookmarksFolder(root: BookmarkNode): string {
  const children = root.children ?? [];
  const other = children.filter((child) => child.folderType === 'other');
  const chosen =
    other.find((child) => child.syncing) ??
    other[0] ??
    children.find((child) => child.id === FIREFOX_OTHER_BOOKMARKS_ID) ??
    // Chrome before 134: bookmarks bar, other bookmarks, mobile bookmarks.
    children[1] ??
    children[0];
  if (!chosen) throw new Error('The bookmarks tree has no folders to create Workspace in');
  return chosen.id;
}
