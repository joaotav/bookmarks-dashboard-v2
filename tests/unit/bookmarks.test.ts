import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { ensureRoot, getWorkspace, subscribe } from '@/lib/bookmarks';
import { installFakeBookmarks } from '../fixtures/fake-bookmarks';
import { chromeRoot, firefoxRoot, folder, link, separator } from '../fixtures/trees';

const storedRootId = async () => (await fakeBrowser.storage.local.get('workspaceRootId')).workspaceRootId;

beforeEach(() => fakeBrowser.reset());

describe('ensureRoot', () => {
  it('creates Workspace in Firefox\'s Other Bookmarks and remembers it', async () => {
    const { find } = installFakeBookmarks(firefoxRoot());
    const id = await ensureRoot();
    expect(find('unfiled_____')!.children!.map((node) => [node.id, node.title])).toEqual([[id, 'Workspace']]);
    expect(await storedRootId()).toBe(id);
  });

  it('creates Workspace in the synced account copy of Chrome\'s Other bookmarks', async () => {
    const { find } = installFakeBookmarks(chromeRoot({ account: true }));
    const id = await ensureRoot();
    expect(find('5')!.children!.map((node) => node.id)).toEqual([id]);
    expect(find('2')!.children).toEqual([]);
  });

  it('returns the same folder on later calls instead of creating another', async () => {
    const { find } = installFakeBookmarks(firefoxRoot());
    const id = await ensureRoot();
    expect(await ensureRoot()).toBe(id);
    expect(find('unfiled_____')!.children).toHaveLength(1);
  });

  it('adopts an existing Workspace folder, like one that arrived through sync', async () => {
    const root = firefoxRoot();
    root.children![1]!.children!.push(folder('synced', 'Workspace'));
    const { find } = installFakeBookmarks(root);
    expect(await ensureRoot()).toBe('synced');
    expect(find('unfiled_____')!.children).toEqual([]);
    expect(await storedRootId()).toBe('synced');
  });

  it('looks again when the remembered folder was deleted', async () => {
    const root = firefoxRoot();
    root.children![2]!.children!.push(folder('w2', 'Workspace'));
    installFakeBookmarks(root);
    await fakeBrowser.storage.local.set({ workspaceRootId: 'deleted' });
    expect(await ensureRoot()).toBe('w2');
  });

  it('ignores links and separators titled Workspace', async () => {
    const root = firefoxRoot();
    root.children![2]!.children!.push(link('l1', 'Workspace', 'https://workspace.example'), { ...separator('x1'), title: 'Workspace' });
    installFakeBookmarks(root);
    await fakeBrowser.storage.local.set({ workspaceRootId: 'l1' });
    const id = await ensureRoot();
    expect(id).not.toBe('l1');
    expect(id).not.toBe('x1');
  });
});

describe('getWorkspace', () => {
  it('returns the Workspace folder with its whole subtree', async () => {
    const root = firefoxRoot();
    root.children![2]!.children!.push(folder('w', 'Workspace', [folder('s1', 'Work', [link('l1', 'A', 'https://a.example')])]));
    installFakeBookmarks(root);
    const workspace = await getWorkspace();
    expect(workspace.id).toBe('w');
    expect(workspace.children![0]!.children![0]!.url).toBe('https://a.example');
  });
});

describe('subscribe', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('calls back once after a burst of changes', () => {
    const { events } = installFakeBookmarks(chromeRoot());
    const onChange = vi.fn();
    subscribe(onChange);
    events.onCreated.fire();
    events.onMoved.fire();
    events.onChanged.fire();
    vi.advanceTimersByTime(49);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('listens to every kind of change', () => {
    const { events } = installFakeBookmarks(chromeRoot());
    const onChange = vi.fn();
    subscribe(onChange);
    for (const event of Object.values(events)) {
      event!.fire();
      vi.advanceTimersByTime(50);
    }
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('works without onChildrenReordered, which Firefox lacks', () => {
    const { events } = installFakeBookmarks(firefoxRoot(), { childrenReordered: false });
    const onChange = vi.fn();
    subscribe(onChange);
    events.onRemoved.fire();
    vi.advanceTimersByTime(50);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('stops listening and drops a pending call when unsubscribed', () => {
    const { events } = installFakeBookmarks(chromeRoot());
    const onChange = vi.fn();
    const unsubscribe = subscribe(onChange);
    events.onCreated.fire();
    unsubscribe();
    vi.advanceTimersByTime(50);
    expect(onChange).not.toHaveBeenCalled();
    expect(Object.values(events).some((event) => event!.hasListeners())).toBe(false);
  });
});
