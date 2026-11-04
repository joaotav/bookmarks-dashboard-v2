import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { openInBackground } from '@/lib/tabs';

describe('openInBackground', () => {
  beforeEach(() => fakeBrowser.reset());

  it('opens every URL in a background tab, in order', async () => {
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    await openInBackground(['https://github.com/', 'https://gitlab.com/']);
    expect(create.mock.calls).toEqual([[{ url: 'https://github.com/', active: false }], [{ url: 'https://gitlab.com/', active: false }]]);
  });
});
