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
  const parentOf = (id: string) => all(root).find((node) => node.children?.some((child) => child.id === id));
  // The browser reports where a node sits, like Chrome and Firefox do in getSubTree.
  const withPosition = (node: BookmarkNode): BookmarkNode => {
    const parent = parentOf(node.id);
    return parent ? { ...node, parentId: parent.id, index: parent.children!.indexOf(node) } : node;
  };

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
      return [clone(withPosition(node))];
    },
    async getChildren(id: string) {
      const node = find(id);
      if (!node?.children) throw new Error(`Can't find bookmark for id.`);
      return node.children.map(withoutChildren);
    },
    search: async ({ title }: { title: string }) => all(root).filter((node) => node !== root && node.title === title).map(withoutChildren),
    async create({ parentId, index, title = '', url, type }: { parentId: string; index?: number; title?: string; url?: string; type?: 'separator' }) {
      const parent = find(parentId);
      if (!parent?.children) throw new Error(`Can't find parent bookmark for id.`);
      if (index !== undefined && index > parent.children.length) throw new Error('Index out of bounds.');
      const id = String(nextId++);
      const node: BookmarkNode =
        type === 'separator' ? { id, title: '', type, url: 'data:' } : url === undefined ? { id, title, children: [] } : { id, title, url };
      parent.children.splice(index ?? parent.children.length, 0, node);
      events.onCreated.fire(node.id, withoutChildren(node));
      return withoutChildren(node);
    },
    async remove(id: string) {
      const node = find(id);
      if (!node) throw new Error(`Can't find bookmark for id.`);
      if (node.children?.length) throw new Error("Can't remove non-empty folder (use recursive to force).");
      return this.removeTree(id);
    },
    async removeTree(id: string) {
      const parent = parentOf(id);
      if (!parent) throw new Error(`Can't find bookmark for id.`);
      const index = parent.children!.findIndex((child) => child.id === id);
      const [node] = parent.children!.splice(index, 1);
      events.onRemoved.fire(id, { parentId: parent.id, index, node: withoutChildren(node!) });
    },
    async update(id: string, changes: { title?: string; url?: string }) {
      const node = find(id);
      if (!node) throw new Error(`Can't find bookmark for id.`);
      Object.assign(node, changes);
      events.onChanged.fire(id, changes);
      return withoutChildren(node);
    },
  };
  Object.assign(fakeBrowser.bookmarks, api);
  return { root, events, find };
}
