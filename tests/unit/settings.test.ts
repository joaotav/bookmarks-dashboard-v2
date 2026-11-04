import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  cacheSettings,
  DEFAULTS,
  getCachedSettings,
  getSettings,
  setSettings,
  toSettings,
  watchSettings,
  type Settings,
} from '@/lib/settings';

const custom: Settings = {
  layout: 'grid',
  theme: 'rose-pine-dawn',
  density: 'compact',
  titles: 'with-url',
  sizing: 'fixed',
};

describe('toSettings', () => {
  it('uses the defaults when nothing is stored', () => {
    expect(toSettings(undefined)).toEqual(DEFAULTS);
    expect(toSettings('oops')).toEqual(DEFAULTS);
  });

  it('defaults are Grid, Neutral dark, Comfortable, one-line titles and fit content', () => {
    expect(DEFAULTS).toEqual({
      layout: 'grid',
      theme: 'neutral-dark',
      density: 'comfortable',
      titles: 'one-line',
      sizing: 'fit-content',
    });
  });

  it('keeps every stored field that is valid', () => {
    expect(toSettings(custom)).toEqual(custom);
  });

  it('falls back field by field for missing or unknown values', () => {
    expect(toSettings({ theme: 'dracula', density: 'roomy', sizing: 7 })).toEqual({ ...DEFAULTS, theme: 'dracula' });
  });

  it('drops fields it does not know', () => {
    expect(toSettings({ ...custom, zoom: 2 })).toEqual(custom);
  });

  it('ignores option names inherited from Object', () => {
    expect(toSettings({ theme: 'toString' }).theme).toBe(DEFAULTS.theme);
  });
});

describe('stored settings', () => {
  beforeEach(() => fakeBrowser.reset());

  it('reads back what was stored, from synced storage', async () => {
    await setSettings(custom);
    expect(await getSettings()).toEqual(custom);
    expect((await fakeBrowser.storage.sync.get('settings')).settings).toEqual(custom);
  });

  it('notifies watchers until they stop watching', async () => {
    const onChange = vi.fn();
    const stop = watchSettings(onChange);
    await setSettings(custom);
    await fakeBrowser.storage.sync.set({ other: 1 });
    stop();
    await setSettings(DEFAULTS);
    expect(onChange.mock.calls).toEqual([[custom]]);
  });

  it('ignores a key with the same name in local storage', async () => {
    const onChange = vi.fn();
    watchSettings(onChange);
    await fakeBrowser.storage.local.set({ settings: custom });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('cached settings', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: store.set.bind(store) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('uses the defaults until something is cached', () => {
    expect(getCachedSettings()).toEqual(DEFAULTS);
  });

  it('reads back what was cached', () => {
    cacheSettings(custom);
    expect(getCachedSettings()).toEqual(custom);
  });

  it('uses the defaults when the copy is unreadable', () => {
    store.set('settings', '{not json');
    expect(getCachedSettings()).toEqual(DEFAULTS);
  });

  it('uses the defaults, without failing, when the browser blocks storage', () => {
    const blocked = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked });
    expect(() => cacheSettings(custom)).not.toThrow();
    expect(getCachedSettings()).toEqual(DEFAULTS);
  });
});
