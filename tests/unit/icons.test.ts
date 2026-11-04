import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { iconFor, letterTile } from '@/lib/icons';
import type { Link } from '@/lib/tree';

const link = (url: string, title = 'Title', openable = true): Link => ({ id: '1', title, url, openable });

describe('iconFor', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('asks Chrome for the cached favicon of the page', () => {
    const url = new URL(iconFor(link('https://github.com/a/b?q=1'))!);
    expect(`${url.protocol}//${url.host}${url.pathname}`).toBe(`chrome-extension://${fakeBrowser.runtime.id}/_favicon/`);
    expect(url.searchParams.get('pageUrl')).toBe('https://github.com/a/b?q=1');
    expect(url.searchParams.get('size')).toBe('32');
  });

  it('returns no icon for links that cannot be opened', () => {
    expect(iconFor(link('javascript:alert(1)', 'Bookmarklet', false))).toBeNull();
  });

  it('returns no icon on Firefox, which has no favicon service', () => {
    vi.stubEnv('BROWSER', 'firefox');
    expect(iconFor(link('https://github.com'))).toBeNull();
  });
});

describe('letterTile', () => {
  it('uses the first letter of the host, without www', () => {
    expect(letterTile(link('https://www.github.com/a')).letter).toBe('G');
    expect(letterTile(link('https://mail.google.com')).letter).toBe('M');
  });

  it('falls back to the title when the URL has no host', () => {
    expect(letterTile(link('javascript:void(0)', 'bookmarklet', false)).letter).toBe('B');
  });

  it('shows a question mark when there is nothing to use', () => {
    expect(letterTile(link('not a url', '', false)).letter).toBe('?');
  });

  it('gives the same host the same color, and colors stay in range', () => {
    const a = letterTile(link('https://github.com/one', 'One'));
    const b = letterTile(link('https://github.com/two', 'Two'));
    expect(a.hue).toBe(b.hue);
    for (const host of ['a.example', 'b.example', 'zzzzzzzzzzzzzzzzzzzz.example']) {
      const { hue } = letterTile(link(`https://${host}`));
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
});
