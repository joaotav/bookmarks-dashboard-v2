import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getCollapsed, setCollapsed, watchCollapsed } from '@/lib/meta';

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
