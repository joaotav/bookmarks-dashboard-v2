import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SearchBox from '@/components/SearchBox.svelte';
import type { Space } from '@/lib/tree';

const link = (id: string, title: string, url: string) => ({ id, title, url, openable: true });
const spaces: Space[] = [
  {
    id: 's1',
    name: 'Work',
    emoji: '💼',
    unsorted: [],
    categories: [
      { id: 'c1', title: 'Repos', links: [link('gh', 'GitHub', 'https://github.com/'), link('gl', 'GitLab', 'https://gitlab.com/')] },
    ],
  },
  { id: 's2', name: 'Home', emoji: null, unsorted: [], categories: [{ id: 'c2', title: 'Media', links: [link('yt', 'YouTube', 'https://www.youtube.com/')] }] },
];

const setup = () => {
  const onopen = vi.fn();
  render(SearchBox, { spaces, onopen });
  const box = screen.getByRole('combobox', { name: 'Search all spaces' });
  return { onopen, box };
};

const type = async (box: HTMLElement, text: string) => {
  await fireEvent.focus(box);
  await fireEvent.input(box, { target: { value: text } });
};

const options = () => screen.getAllByRole('option').map((option) => option.textContent?.replace(/\s+/g, ' ').trim());

describe('SearchBox', () => {
  it('lists matching links from every space with where they live, and marks the matched letters', async () => {
    const { box } = setup();
    expect(box).toHaveAttribute('aria-expanded', 'false');
    await type(box, 'gthb');
    expect(box).toHaveAttribute('aria-expanded', 'true');
    expect(options()).toEqual(['GitHub Work › Repos · github.com']);
    expect([...screen.getByRole('option').querySelectorAll('mark')].map((mark) => mark.textContent)).toEqual(['G', 'tH', 'b']);

    await type(box, 'tube');
    expect(options()).toEqual(['YouTube Home › Media · youtube.com']);
  });

  it('tells pages on the same site apart by their address, with the full URL on hover', async () => {
    const onopen = vi.fn();
    const sameSite: Space[] = [
      {
        id: 's1',
        name: 'Work',
        emoji: null,
        unsorted: [],
        categories: [
          {
            id: 'c1',
            title: 'Svelte',
            links: [link('a', 'Svelte issues', 'https://github.com/sveltejs/svelte/issues'), link('b', 'Svelte pulls', 'https://github.com/sveltejs/svelte/pulls')],
          },
        ],
      },
    ];
    render(SearchBox, { spaces: sameSite, onopen });
    await type(screen.getByRole('combobox'), 'svelte');
    expect(options()).toEqual([
      'Svelte pulls Work › Svelte · github.com/sveltejs/svelte/pulls',
      'Svelte issues Work › Svelte · github.com/sveltejs/svelte/issues',
    ]);
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('title', 'https://github.com/sveltejs/svelte/pulls');
  });

  it('says so when nothing matches', async () => {
    const { box } = setup();
    await type(box, 'zzzz');
    expect(screen.getByText('No links match')).toBeInTheDocument();
  });

  it('moves the selection with the arrow keys, wrapping around', async () => {
    const { box } = setup();
    await type(box, 'git');
    const selected = () => screen.getByRole('option', { selected: true }).id;
    expect(selected()).toBe('search-result-0');
    expect(box).toHaveAttribute('aria-activedescendant', 'search-result-0');
    await fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(selected()).toBe('search-result-1');
    await fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(selected()).toBe('search-result-0');
    await fireEvent.keyDown(box, { key: 'ArrowUp' });
    expect(selected()).toBe('search-result-1');
  });

  it('opens the selected link with Enter, or in a background tab with Ctrl+Enter or Cmd+Enter', async () => {
    const { box, onopen } = setup();
    await type(box, 'git');
    await fireEvent.keyDown(box, { key: 'Enter' });
    expect(onopen).toHaveBeenLastCalledWith('https://github.com/', false);
    await fireEvent.keyDown(box, { key: 'ArrowDown' });
    await fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
    expect(onopen).toHaveBeenLastCalledWith('https://gitlab.com/', true);
    await fireEvent.keyDown(box, { key: 'Enter', metaKey: true });
    expect(onopen).toHaveBeenLastCalledWith('https://gitlab.com/', true);
  });

  it('opens a clicked result, in the background with Ctrl or the middle button', async () => {
    const { box, onopen } = setup();
    await type(box, 'git');
    const [github, gitlab] = screen.getAllByRole('option');
    await fireEvent.click(github!);
    expect(onopen).toHaveBeenLastCalledWith('https://github.com/', false);
    await fireEvent.click(gitlab!, { ctrlKey: true });
    expect(onopen).toHaveBeenLastCalledWith('https://gitlab.com/', true);
    await fireEvent(github!, new MouseEvent('auxclick', { button: 1, bubbles: true }));
    expect(onopen).toHaveBeenLastCalledWith('https://github.com/', true);
  });

  it('clears the search with Escape, then leaves the box with another Escape', async () => {
    const { box } = setup();
    box.focus();
    await type(box, 'git');
    await fireEvent.keyDown(box, { key: 'Escape' });
    expect(box).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(box).toHaveFocus();
    await fireEvent.keyDown(box, { key: 'Escape' });
    expect(box).not.toHaveFocus();
  });

  it('focuses with "/", except while typing in another field', async () => {
    const { box } = setup();
    const other = document.body.appendChild(document.createElement('input'));
    other.focus();
    await fireEvent.keyDown(other, { key: '/' });
    expect(other).toHaveFocus();
    other.blur();
    await fireEvent.keyDown(document.body, { key: '/' });
    expect(box).toHaveFocus();
    other.remove();
  });
});
