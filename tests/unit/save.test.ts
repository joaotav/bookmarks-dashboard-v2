import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getIcons, getLastCategoryId } from '@/lib/meta';
import { currentPage, savePage } from '@/lib/save';
import { installFakeBookmarks } from '../fixtures/fake-bookmarks';
import { firefoxRoot, folder } from '../fixtures/trees';

beforeEach(() => fakeBrowser.reset());
afterEach(() => vi.unstubAllEnvs());

describe('currentPage', () => {
  it('reads the active tab of the current window', async () => {
    const query = vi
      .spyOn(fakeBrowser.tabs, 'query')
      .mockResolvedValue([{ url: 'https://github.com/', title: 'GitHub', favIconUrl: 'https://github.com/favicon.ico' }] as never);
    expect(await currentPage()).toEqual({ url: 'https://github.com/', title: 'GitHub', favIconUrl: 'https://github.com/favicon.ico' });
    expect(query).toHaveBeenCalledWith({ active: true, currentWindow: true });
  });

  it('returns null when the browser hides the URL', async () => {
    vi.spyOn(fakeBrowser.tabs, 'query').mockResolvedValue([{ title: 'Private' }] as never);
    expect(await currentPage()).toBeNull();
  });
});

describe('savePage', () => {
  const setup = () => {
    const root = firefoxRoot();
    root.children![2]!.children!.push(folder('w', 'Workspace', [folder('s1', 'Work', [folder('c1', 'Repos')])]));
    return installFakeBookmarks(root);
  };
  const page = { url: 'https://github.com/', title: 'GitHub', favIconUrl: 'https://github.com/favicon.ico' };

  it('adds the link at the end of the category and remembers the category', async () => {
    const { find } = setup();
    const id = await savePage('c1', page);
    expect(find('c1')!.children).toEqual([{ id, title: 'GitHub', url: 'https://github.com/' }]);
    expect(await getLastCategoryId()).toBe('c1');
  });

  it('keeps https: and data: image icons in Firefox', async () => {
    vi.stubEnv('BROWSER', 'firefox');
    setup();
    const github = await savePage('c1', page);
    const tiny = await savePage('c1', { ...page, favIconUrl: 'data:image/png;base64,AAAA' });
    expect(await getIcons()).toEqual(
      new Map([
        [github, 'https://github.com/favicon.ico'],
        [tiny, 'data:image/png;base64,AAAA'],
      ]),
    );
  });

  it('skips other icons in Firefox, and every icon in Chrome', async () => {
    vi.stubEnv('BROWSER', 'firefox');
    setup();
    await savePage('c1', { ...page, favIconUrl: 'http://github.com/favicon.ico' });
    await savePage('c1', { ...page, favIconUrl: 'chrome://global/skin/icons/info.svg' });
    vi.stubEnv('BROWSER', 'chrome');
    await savePage('c1', page);
    expect(await getIcons()).toEqual(new Map());
  });
});
