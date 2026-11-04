import { describe, expect, it } from 'vitest';
import type { BookmarkNode } from '@/lib/node';
import { splitEmoji, toSpaces, UNSORTED } from '@/lib/tree';

const folder = (id: string, title: string, children: BookmarkNode[] = []): BookmarkNode => ({ id, title, children });
const link = (id: string, title: string, url: string): BookmarkNode => ({ id, title, url });
const separator = (id: string): BookmarkNode => ({ id, title: '', url: 'data:', type: 'separator' });

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
