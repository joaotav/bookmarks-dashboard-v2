import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getCollapsed, getIcons, getLastCategoryId, setCollapsed, setIcon, setLastCategoryId, watchCollapsed, watchIcons } from '@/lib/meta';

describe('collapsed state', () => {
  beforeEach(() => fakeBrowser.reset());

  it('is empty when nothing is stored', async () => {
    expect(await getCollapsed()).toEqual([]);
  });

  it('reads back what was stored', async () => {
    await setCollapsed(['12', '40']);
    expect(await getCollapsed()).toEqual(['12', '40']);
  });

  it('ignores stored values of the wrong shape', async () => {
    await fakeBrowser.storage.local.set({ collapsed: ['12', 7, null] });
    expect(await getCollapsed()).toEqual(['12']);
    await fakeBrowser.storage.local.set({ collapsed: 'oops' });
    expect(await getCollapsed()).toEqual([]);
  });

  it('notifies watchers until they stop watching', async () => {
    const onChange = vi.fn();
    const stop = watchCollapsed(onChange);
    await setCollapsed(['12']);
    await fakeBrowser.storage.local.set({ activeSpaceId: '3' });
    stop();
    await setCollapsed([]);
    expect(onChange.mock.calls).toEqual([[['12']]]);
  });

  it('ignores a key with the same name in synced storage', async () => {
    const onChange = vi.fn();
    watchCollapsed(onChange);
    await fakeBrowser.storage.sync.set({ collapsed: ['12'] });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('last category', () => {
  beforeEach(() => fakeBrowser.reset());

  it('is undefined until the popup saves somewhere', async () => {
    expect(await getLastCategoryId()).toBeUndefined();
    await setLastCategoryId('c1');
    expect(await getLastCategoryId()).toBe('c1');
  });
});

describe('saved icons', () => {
  beforeEach(() => fakeBrowser.reset());

  it('reads back the icons by bookmark ID, and nothing else', async () => {
    await setIcon('12', 'https://github.com/favicon.ico');
    await setIcon('40', 'data:image/png;base64,AAAA');
    await fakeBrowser.storage.local.set({ collapsed: ['12'], 'icon:7': 42 });
    expect(await getIcons()).toEqual(
      new Map([
        ['12', 'https://github.com/favicon.ico'],
        ['40', 'data:image/png;base64,AAAA'],
      ]),
    );
  });

  it('notifies watchers of icon changes only', async () => {
    const onChange = vi.fn();
    const stop = watchIcons(onChange);
    await setCollapsed(['12']);
    expect(onChange).not.toHaveBeenCalled();
    await setIcon('12', 'https://github.com/favicon.ico');
    expect(onChange).toHaveBeenCalledOnce();
    stop();
    await setIcon('13', 'https://gitlab.com/favicon.ico');
    expect(onChange).toHaveBeenCalledOnce();
  });
});
