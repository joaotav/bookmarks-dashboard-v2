import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { BookmarkNode } from '@/lib/node';

type Listener = (...args: unknown[]) => void;

/** A browser event that tests can fire by hand. */
export function fakeEvent() {
  const listeners = new Set<Listener>();
  return {
    addListener: (listener: Listener) => void listeners.add(listener),
    removeListener: (listener: Listener) => void listeners.delete(listener),
    hasListeners: () => listeners.size > 0,
    fire: (...args: unknown[]) => listeners.forEach((listener) => listener(...args)),
  };
}

/**
 * Replaces `browser.bookmarks` in WXT's fake browser, which doesn't implement it, with an
 * in-memory tree. Covers the calls src/lib/bookmarks.ts makes. Returns the tree, so tests can
 * inspect it, and the events, so tests can fire them.
 */
export function installFakeBookmarks(root: BookmarkNode, { childrenReordered = true } = {}) {
  const find = (id: string, node: BookmarkNode = root): BookmarkNode | undefined =>
    node.id === id ? node : node.children?.map((child) => find(id, child)).find(Boolean);
  const all = (node: BookmarkNode): BookmarkNode[] => [node, ...(node.children ?? []).flatMap(all)];
  const clone = (node: BookmarkNode): BookmarkNode => structuredClone(node);
  const withoutChildren = ({ children: _, ...node }: BookmarkNode) => node;

  const events = {
    onCreated: fakeEvent(),
    onRemoved: fakeEvent(),
    onChanged: fakeEvent(),
    onMoved: fakeEvent(),
    // Firefox doesn't have this event.
    onChildrenReordered: childrenReordered ? fakeEvent() : undefined,
  };
  let nextId = 1000;

  const api = {
    ...events,
    async get(id: string) {
      const node = find(id);
      if (!node) throw new Error(`Can't find bookmark for id.`);
      return [withoutChildren(node)];
    },
    getTree: async () => [clone(root)],
    async getSubTree(id: string) {
      const node = find(id);
      if (!node) throw new Error(`Can't find bookmark for id.`);
      return [clone(node)];
    },
    search: async ({ title }: { title: string }) => all(root).filter((node) => node !== root && node.title === title).map(withoutChildren),
    async create({ parentId, title = '', url }: { parentId: string; title?: string; url?: string }) {
      const parent = find(parentId);
      if (!parent?.children) throw new Error(`Can't find parent bookmark for id.`);
      const node: BookmarkNode = url === undefined ? { id: String(nextId++), title, children: [] } : { id: String(nextId++), title, url };
      parent.children.push(node);
      events.onCreated.fire(node.id, withoutChildren(node));
      return withoutChildren(node);
    },
  };
  Object.assign(fakeBrowser.bookmarks, api);
  return { root, events, find };
}
