import { describe, expect, it } from 'vitest';
import { pickOtherBookmarksFolder } from '@/lib/root';
import { chromeRoot, firefoxRoot, folder, legacyChromeRoot } from '../fixtures/trees';

describe('pickOtherBookmarksFolder', () => {
  it('picks unfiled_____ on Firefox', () => {
    expect(pickOtherBookmarksFolder(firefoxRoot())).toBe('unfiled_____');
  });

  it('picks the folder typed "other" on Chrome 134+', () => {
    expect(pickOtherBookmarksFolder(chromeRoot())).toBe('2');
  });

  it('prefers the synced account copy when Chrome has local and account folders', () => {
    expect(pickOtherBookmarksFolder(chromeRoot({ account: true }))).toBe('5');
  });

  it('falls back to the second root folder on Chrome before 134', () => {
    expect(pickOtherBookmarksFolder(legacyChromeRoot())).toBe('2');
  });

  it('throws when the tree has no folders', () => {
    expect(() => pickOtherBookmarksFolder(folder('0', ''))).toThrow();
  });
});
