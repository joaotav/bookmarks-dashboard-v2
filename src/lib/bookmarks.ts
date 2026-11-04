import { browser } from 'wxt/browser';
import type { BookmarkNode } from './node';
import { pickOtherBookmarksFolder } from './root';

const WORKSPACE_TITLE = 'Workspace';
const ROOT_ID_KEY = 'workspaceRootId';

/**
 * Returns the ID of the Workspace folder, creating it on first use. Looks for an existing
 * folder by title before creating one, so a Workspace that arrived through sync is adopted
 * instead of duplicated.
 */
export async function ensureRoot(): Promise<string> {
  const stored = (await browser.storage.local.get(ROOT_ID_KEY))[ROOT_ID_KEY];
  if (typeof stored === 'string') {
    const [node] = await browser.bookmarks.get(stored).catch(() => []);
    if (node && node.url === undefined) return node.id;
  }

  const existing = (await browser.bookmarks.search({ title: WORKSPACE_TITLE })).find(
    (node) => node.url === undefined && (node as BookmarkNode).type !== 'separator',
  );
  const id =
    existing?.id ??
    (
      await browser.bookmarks.create({
        parentId: pickOtherBookmarksFolder((await browser.bookmarks.getTree())[0]!),
        title: WORKSPACE_TITLE,
      })
    ).id;
  await browser.storage.local.set({ [ROOT_ID_KEY]: id });
  return id;
}

/** The Workspace folder with its whole subtree. */
export async function getWorkspace(): Promise<BookmarkNode> {
  const [root] = await browser.bookmarks.getSubTree(await ensureRoot());
  return root!;
}

/** Creates a folder at the end of `parentId`, or a link when `url` is given. Returns its ID. */
export async function create(parentId: string, title: string, url?: string): Promise<string> {
  return (await browser.bookmarks.create({ parentId, title, ...(url !== undefined && { url }) })).id;
}

/** Renames a folder or link, or changes a link's URL. */
export async function update(id: string, changes: { title?: string; url?: string }): Promise<void> {
  await browser.bookmarks.update(id, changes);
}

/**
 * Calls `onChange` after any bookmark change, wherever it came from: this page, the browser's
 * bookmark manager or sync. Bursts of events, like a sync, are debounced into one call.
 * Returns a function that stops listening.
 */
export function subscribe(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const changed = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, 50);
  };
  const events = [
    browser.bookmarks.onCreated,
    browser.bookmarks.onRemoved,
    browser.bookmarks.onChanged,
    browser.bookmarks.onMoved,
    // Chrome only.
    browser.bookmarks.onChildrenReordered,
  ].filter((event) => event !== undefined);
  for (const event of events) event.addListener(changed);
  return () => {
    clearTimeout(timer);
    for (const event of events) event.removeListener(changed);
  };
}
