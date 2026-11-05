import { describe, expect, it } from 'vitest';
import { defaultTitle, joinEmoji, placesOf, splitEmoji, toSpaces, toWebUrl, UNSORTED } from '@/lib/tree';
import { folder, link, separator } from '../fixtures/trees';

describe('splitEmoji', () => {
  it('splits a leading emoji from the name', () => {
    expect(splitEmoji('💼 Work')).toEqual({ emoji: '💼', name: 'Work' });
  });

  it('keeps emoji made of several code points whole', () => {
    expect(splitEmoji('🛠️ Side projects')).toEqual({ emoji: '🛠️', name: 'Side projects' });
    expect(splitEmoji('🇧🇷 Brasil')).toEqual({ emoji: '🇧🇷', name: 'Brasil' });
    expect(splitEmoji('👩‍💻 Code')).toEqual({ emoji: '👩‍💻', name: 'Code' });
  });

  it('returns no emoji for a plain name', () => {
    expect(splitEmoji('Work')).toEqual({ emoji: null, name: 'Work' });
    expect(splitEmoji('')).toEqual({ emoji: null, name: '' });
  });

  it('does not treat digits or symbols as an emoji', () => {
    expect(splitEmoji('2026 taxes')).toEqual({ emoji: null, name: '2026 taxes' });
    expect(splitEmoji('# notes')).toEqual({ emoji: null, name: '# notes' });
  });
});

describe('toSpaces', () => {
  it('turns folders into spaces and their folders into categories', () => {
    const workspace = folder('w', 'Workspace', [
      folder('s1', '💼 Work', [
        folder('c1', 'Daily', [link('l1', 'Gmail', 'https://mail.google.com')]),
        folder('c2', 'Repos', []),
      ]),
      folder('s2', 'Home'),
    ]);
    expect(toSpaces(workspace)).toEqual([
      {
        id: 's1',
        name: 'Work',
        emoji: '💼',
        unsorted: [],
        categories: [
          { id: 'c1', title: 'Daily', links: [{ id: 'l1', title: 'Gmail', url: 'https://mail.google.com', openable: true }] },
          { id: 'c2', title: 'Repos', links: [] },
        ],
      },
      { id: 's2', name: 'Home', emoji: null, unsorted: [], categories: [] },
    ]);
  });

  it('collects links directly in a space as its unsorted links', () => {
    const [space] = toSpaces(folder('w', 'Workspace', [folder('s1', 'Work', [link('l1', 'A', 'https://a.example')])]));
    expect(space!.unsorted.map((l) => l.id)).toEqual(['l1']);
  });

  it('adds an Unsorted space for links directly in Workspace, using the Workspace ID', () => {
    const spaces = toSpaces(folder('w', 'Workspace', [folder('s1', 'Work'), link('l1', 'A', 'https://a.example')]));
    expect(spaces.map((s) => [s.id, s.name])).toEqual([
      ['s1', 'Work'],
      ['w', UNSORTED],
    ]);
    expect(spaces[1]!.unsorted.map((l) => l.id)).toEqual(['l1']);
  });

  it('flattens folders nested inside a category, keeping order', () => {
    const [space] = toSpaces(
      folder('w', 'Workspace', [
        folder('s1', 'Work', [
          folder('c1', 'Repos', [
            link('l1', 'A', 'https://a.example'),
            folder('f1', 'Nested', [link('l2', 'B', 'https://b.example'), folder('f2', 'Deeper', [link('l3', 'C', 'https://c.example')])]),
            link('l4', 'D', 'https://d.example'),
          ]),
        ]),
      ]),
    );
    expect(space!.categories[0]!.links.map((l) => l.id)).toEqual(['l1', 'l2', 'l3', 'l4']);
  });

  it('skips Firefox separators', () => {
    const [space] = toSpaces(
      folder('w', 'Workspace', [
        separator('x0'),
        folder('s1', 'Work', [separator('x1'), folder('c1', 'Daily', [link('l1', 'A', 'https://a.example'), separator('x2')])]),
      ]),
    );
    expect(space!.unsorted).toEqual([]);
    expect(space!.categories[0]!.links.map((l) => l.id)).toEqual(['l1']);
  });

  it('only makes http and https links openable', () => {
    const [space] = toSpaces(
      folder('w', 'Workspace', [
        folder('s1', 'Work', [
          folder('c1', 'Mixed', [
            link('l1', 'Web', 'https://a.example'),
            link('l2', 'Plain', 'http://b.example'),
            link('l3', 'Bookmarklet', 'javascript:alert(1)'),
            link('l4', 'Firefox query', 'place:sort=8&maxResults=10'),
            link('l5', 'Broken', 'not a url'),
          ]),
        ]),
      ]),
    );
    expect(space!.categories[0]!.links.map((l) => l.openable)).toEqual([true, true, false, false, false]);
  });

  it('uses the URL as the title when a bookmark has none', () => {
    const [space] = toSpaces(folder('w', 'Workspace', [folder('s1', 'Work', [link('l1', '', 'https://a.example/')])]));
    expect(space!.unsorted[0]!.title).toBe('https://a.example/');
  });

  it('returns no spaces for an empty Workspace', () => {
    expect(toSpaces(folder('w', 'Workspace'))).toEqual([]);
  });
});

describe('joinEmoji', () => {
  it('puts the emoji before the name, and splitEmoji takes it back off', () => {
    expect(joinEmoji('🛠️', 'Side projects')).toBe('🛠️ Side projects');
    expect(splitEmoji(joinEmoji('🛠️', 'Side projects'))).toEqual({ emoji: '🛠️', name: 'Side projects' });
  });

  it('uses the name alone without an emoji', () => {
    expect(joinEmoji(null, 'Work')).toBe('Work');
  });
});

describe('toWebUrl', () => {
  it('keeps http and https addresses', () => {
    expect(toWebUrl('https://github.com/sveltejs')).toBe('https://github.com/sveltejs');
    expect(toWebUrl('  http://example.com  ')).toBe('http://example.com/');
  });

  it('adds https:// when there is no scheme', () => {
    expect(toWebUrl('github.com')).toBe('https://github.com/');
    expect(toWebUrl('localhost:3000/admin')).toBe('https://localhost:3000/admin');
  });

  it('refuses addresses that are not web pages', () => {
    for (const input of ['javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'about:config', 'mailto:me@example.com']) {
      expect(toWebUrl(input), input).toBeNull();
    }
  });

  it('refuses empty or malformed input', () => {
    expect(toWebUrl('')).toBeNull();
    expect(toWebUrl('not a url')).toBeNull();
  });

  it('refuses addresses with a username or password', () => {
    expect(toWebUrl('https://user@example.com/')).toBeNull();
    expect(toWebUrl('https://:hunter2@example.com/')).toBeNull();
  });
});

describe('defaultTitle', () => {
  it('is the hostname without www.', () => {
    expect(defaultTitle('https://www.youtube.com/watch?v=1')).toBe('youtube.com');
    expect(defaultTitle('https://docs.github.com/en')).toBe('docs.github.com');
  });
});

describe('saved icons and places', () => {
  const workspace = folder('w', 'Workspace', [
    folder('s1', '💼 Work', [
      link('loose', 'Loose', 'https://example.com/'),
      folder('c1', 'Repos', [link('l1', 'GitHub', 'https://github.com/')]),
      folder('c2', 'Docs', [folder('old', 'Old', [link('l2', 'GitHub again', 'https://github.com/')])]),
    ]),
    link('top', 'Top', 'https://example.org/'),
  ]);

  it('attaches saved icons to their links', () => {
    const spaces = toSpaces(workspace, new Map([['l1', 'https://github.com/favicon.ico']]));
    expect(spaces[0]!.categories[0]!.links[0]!.icon).toBe('https://github.com/favicon.ico');
    expect(spaces[0]!.unsorted[0]).not.toHaveProperty('icon');
  });

  it('names every place a URL is saved, including nested folders and Unsorted', () => {
    const spaces = toSpaces(workspace);
    expect(placesOf(spaces, 'https://github.com/')).toEqual(['Work › Repos', 'Work › Docs']);
    expect(placesOf(spaces, 'https://example.com')).toEqual([`Work › ${UNSORTED}`]);
    expect(placesOf(spaces, 'https://example.org/')).toEqual([UNSORTED]);
    expect(placesOf(spaces, 'https://gitlab.com/')).toEqual([]);
  });
});
