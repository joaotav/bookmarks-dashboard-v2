import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SaveForm from '@/components/SaveForm.svelte';
import type { Space } from '@/lib/tree';

const link = (id: string, url: string) => ({ id, title: id, url, openable: true });
const spaces: Space[] = [
  {
    id: 's1',
    name: 'Work',
    emoji: '💼',
    unsorted: [],
    categories: [
      { id: 'c1', title: 'Repos', links: [link('l1', 'https://github.com/')] },
      { id: 'c2', title: 'Docs', links: [] },
    ],
  },
  { id: 's2', name: 'Empty', emoji: null, unsorted: [], categories: [] },
  { id: 's3', name: 'Home', emoji: null, unsorted: [], categories: [{ id: 'c3', title: 'Media', links: [] }] },
];
const props = { url: 'https://gitlab.com/', title: 'GitLab', spaces, categoryId: undefined, onsave: () => {}, oncancel: () => {} };

describe('SaveForm', () => {
  it('fills in the page and selects its title for retyping', () => {
    render(SaveForm, props);
    const title = screen.getByRole('textbox', { name: 'Title' }) as HTMLInputElement;
    expect(title).toHaveValue('GitLab');
    expect([title.selectionStart, title.selectionEnd]).toEqual([0, 6]);
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('https://gitlab.com/');
  });

  it('groups the categories by space, leaving out spaces without any', () => {
    render(SaveForm, props);
    const groups = [...document.querySelectorAll('optgroup')].map((group) => [
      group.label,
      [...group.querySelectorAll('option')].map((option) => option.textContent),
    ]);
    expect(groups).toEqual([
      ['💼 Work', ['Repos', 'Docs']],
      ['Home', ['Media']],
    ]);
  });

  it('selects the last used category, or the first one when it is gone', () => {
    const { unmount } = render(SaveForm, { ...props, categoryId: 'c3' });
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('c3');
    unmount();
    render(SaveForm, { ...props, categoryId: 'deleted' });
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('c1');
  });

  it('says where the page is already saved, following the URL field', async () => {
    render(SaveForm, props);
    expect(screen.queryByText(/Already in/)).not.toBeInTheDocument();
    await fireEvent.input(screen.getByRole('textbox', { name: 'URL' }), { target: { value: 'github.com' } });
    expect(screen.getByText('Already in Work › Repos')).toBeInTheDocument();
  });

  it('saves to the chosen category, naming an untitled page after its site', async () => {
    const onsave = vi.fn();
    render(SaveForm, { ...props, onsave });
    await fireEvent.input(screen.getByRole('textbox', { name: 'Title' }), { target: { value: '  ' } });
    await fireEvent.input(screen.getByRole('textbox', { name: 'URL' }), { target: { value: 'www.gitlab.com/explore' } });
    await fireEvent.change(screen.getByRole('combobox', { name: 'Category' }), { target: { value: 'c2' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onsave).toHaveBeenCalledWith('c2', 'https://www.gitlab.com/explore', 'gitlab.com');
  });

  it('refuses an address that is not a web page', async () => {
    const onsave = vi.fn();
    render(SaveForm, { ...props, onsave });
    await fireEvent.input(screen.getByRole('textbox', { name: 'URL' }), { target: { value: 'javascript:alert(1)' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a web address, like example.com');
    expect(onsave).not.toHaveBeenCalled();
  });

  it('cancels', async () => {
    const oncancel = vi.fn();
    render(SaveForm, { ...props, oncancel });
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(oncancel).toHaveBeenCalledOnce();
  });
});
