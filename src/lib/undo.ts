import { browser } from 'wxt/browser';
import { moveMeta } from './meta';
import { isFolder, isSeparator, type BookmarkNode } from './node';

/**
 * Deletes a bookmark, or a folder with everything in it. Returns a snapshot of what was
 * deleted, including where it was, for `restore`.
 */
export async function remove(id: string): Promise<BookmarkNode> {
  const [node] = await browser.bookmarks.getSubTree(id);
  if (isFolder(node!)) await browser.bookmarks.removeTree(id);
  else await browser.bookmarks.remove(id);
  return node!;
}

/**
 * Recreates a deleted subtree at its old position. The browser gives every recreated
 * bookmark a new ID, so collapsed state and icons move to the new IDs. Returns the new ID of
 * the subtree's root.
 */
export async function restore(snapshot: BookmarkNode): Promise<string> {
  const ids = new Map<string, string>();
  const create = async (node: BookmarkNode, parentId: string, index?: number) => {
    const details = isSeparator(node)
      ? // Firefox only. Chrome has no separators, and would reject the field.
        { parentId, index, type: 'separator' }
      : { parentId, index, title: node.title, ...(node.url !== undefined && { url: node.url }) };
    const created = await browser.bookmarks.create(details);
    ids.set(node.id, created.id);
    for (const child of node.children ?? []) await create(child, created.id);
  };

  const parentId = snapshot.parentId!;
  // The folder may have lost items since, so the old position may be past its end.
  const siblings = (await browser.bookmarks.getChildren(parentId)).length;
  await create(snapshot, parentId, Math.min(snapshot.index ?? siblings, siblings));
  await moveMeta(ids);
  return ids.get(snapshot.id)!;
}
