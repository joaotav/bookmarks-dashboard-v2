import { describe, expect, it } from 'vitest';
import { createSearch, type Part } from '@/lib/search';
import type { Link, Space } from '@/lib/tree';

const link = (id: string, title: string, url: string, openable = true): Link => ({ id, title, url, openable });

const spaces: Space[] = [
  {
    id: 's1',
    name: 'Work',
    emoji: '💼',
    unsorted: [link('loose', 'Gather', 'https://app.gather.town/')],
    categories: [
      {
        id: 'c1',
        title: 'Repos',
        links: [link('gh', 'GitHub', 'https://github.com/'), link('gl', 'GitLab', 'https://gitlab.com/')],
      },
      {
        id: 'c2',
        title: 'Docs',
        links: [
          link('mdn', 'MDN Web Docs', 'https://developer.mozilla.org/'),
          link('ghdocs', 'Docs', 'https://docs.github.com/'),
          link('js', 'Go to GitHub', 'javascript:location="https://github.com"', false),
        ],
      },
    ],
  },
  {
    id: 's2',
    name: 'Home',
    emoji: null,
    unsorted: [],
    categories: [{ id: 'c3', title: 'Leitura', links: [link('acao', 'Programação em ação', 'https://www.exemplo.com.br/')] }],
  },
];

const search = createSearch(spaces);
const titles = (query: string) => search(query).map((result) => result.link.title);
const marked = (parts: Part[]) => parts.map(({ text, match }) => (match ? `[${text}]` : text)).join('');

describe('createSearch', () => {
  it('finds GitHub from "gthb"', () => {
    expect(titles('gthb')[0]).toBe('GitHub');
  });

  it('puts the shorter of two equally good matches first', () => {
    const repos = (links: Link[]): Space[] => [{ id: 's', name: 'Work', emoji: null, unsorted: [], categories: [{ id: 'c', title: 'Repos', links }] }];
    const docs = link('d', 'GitHub Docs', 'https://docs.github.com/');
    const github = link('g', 'GitHub', 'https://github.com/');
    expect(createSearch(repos([docs, github]))('gthb').map((result) => result.link.title)).toEqual(['GitHub', 'GitHub Docs']);
  });

  it('ranks a match at the start of a title above one further in', () => {
    expect(titles('git')).toEqual(['GitHub', 'GitLab', 'Docs']);
  });

  it('searches the site too, and words in any order', () => {
    expect(titles('mozilla')).toEqual(['MDN Web Docs']);
    expect(titles('docs mdn')).toEqual(['MDN Web Docs']);
  });

  it('ignores accents and case', () => {
    expect(titles('ACAO')).toEqual(['Programação em ação']);
  });

  it('covers every space and Unsorted, and says where each link lives', () => {
    expect(search('gather').map((result) => result.place)).toEqual(['Work › Unsorted']);
    expect(search('leitura')).toEqual([]);
    expect(search('programacao').map((result) => result.place)).toEqual(['Home › Leitura']);
  });

  it('leaves out links the page cannot open, and returns nothing for a blank query', () => {
    expect(titles('go to')).toEqual([]);
    expect(titles('   ')).toEqual([]);
  });

  it('marks the matched letters in the title and the site', () => {
    const [github] = search('gthb');
    expect(marked(github!.title)).toBe('[G]i[tH]u[b]');
    const [docs] = search('docs github');
    expect(marked(docs!.title)).toBe('[Docs]');
    expect(marked(docs!.address)).toBe('docs.[github].com');
  });

  it('shows the address without its scheme or www, and without a lone trailing slash', () => {
    const page = (url: string) =>
      createSearch([{ id: 's', name: 'Work', emoji: null, unsorted: [link('x', 'Svelte', url)], categories: [] }])('svelte')[0]!;
    expect(marked(page('https://github.com/').address)).toBe('github.com');
    expect(marked(page('https://www.github.com/sveltejs/svelte/issues?q=is%3Aopen').address)).toBe('github.com/sveltejs/svelte/issues?q=is%3Aopen');
    expect(marked(page('http://localhost:5173/svelte').address)).toBe('localhost:5173/svelte');
  });

  it('stops at the limit', () => {
    expect(createSearch(spaces, 2)('o')).toHaveLength(2);
  });
});
