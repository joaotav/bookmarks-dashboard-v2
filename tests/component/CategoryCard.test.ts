import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CategoryCard from '@/components/CategoryCard.svelte';
import type { Link } from '@/lib/tree';

const links: Link[] = [
  { id: 'l1', title: 'GitHub', url: 'https://github.com', openable: true },
  { id: 'l2', title: 'GitLab', url: 'https://gitlab.com', openable: true },
];
const props = { id: 'c1', title: 'Repos', links, collapsed: false, ontoggle: () => {}, onadd: () => {}, onupdatelink: () => {}, ondeletelink: () => {}, onopenall: () => {}, onmovelink: () => {} };

describe('CategoryCard', () => {
  it('shows the category name, its link count and its links', () => {
    render(CategoryCard, props);
    expect(screen.getByRole('heading', { name: /Repos/ })).toHaveTextContent('2');
    expect(screen.getAllByRole('link')).toEqual([
      screen.getByRole('link', { name: 'GitHub' }),
      screen.getByRole('link', { name: 'GitLab' }),
    ]);
  });

  it('says so when the category has no links', () => {
    render(CategoryCard, { ...props, links: [] });
    expect(screen.getByText('No links yet')).toBeInTheDocument();
  });

  it('toggles when the header is clicked', async () => {
    const ontoggle = vi.fn();
    render(CategoryCard, { ...props, ontoggle });
    await fireEvent.click(screen.getByRole('button', { name: /^Repos/ }));
    expect(ontoggle).toHaveBeenCalledOnce();
  });

  it('tells screen readers whether it is expanded, and which element it controls', () => {
    render(CategoryCard, props);
    const header = screen.getByRole('button', { name: /^Repos/ });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(header.getAttribute('aria-controls')!)).toContainElement(screen.getAllByRole('link')[0]!);
  });

  it('hides its links when collapsed', () => {
    render(CategoryCard, { ...props, collapsed: true });
    expect(screen.getByRole('button', { name: /^Repos/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('link')).toEqual([]);
  });

  it('removes and restores its links when collapsed state changes', async () => {
    const { rerender } = render(CategoryCard, props);
    await rerender({ ...props, collapsed: true });
    await vi.waitFor(() => expect(screen.queryAllByRole('link')).toEqual([]));
    await rerender({ ...props, collapsed: false });
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('only offers Open all bookmarks when it cannot be renamed or deleted, like the Unsorted card', async () => {
    render(CategoryCard, props);
    await fireEvent.click(screen.getByRole('button', { name: 'Actions for Repos' }));
    expect(screen.getAllByRole('button').map((button) => button.textContent?.trim())).toContain('Open all bookmarks');
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('has no menu at all without links it could open', () => {
    render(CategoryCard, { ...props, links: [{ id: 'l3', title: 'Bookmarklet', url: 'javascript:void 0', openable: false }] });
    expect(screen.queryByRole('button', { name: 'Actions for Repos' })).toBeNull();
  });

  it('renames itself inline from its menu', async () => {
    const onrename = vi.fn();
    render(CategoryCard, { ...props, onrename, ondelete: () => {} });
    await fireEvent.click(screen.getByRole('button', { name: 'Actions for Repos' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const field = screen.getByRole('textbox', { name: 'Category name' });
    await fireEvent.input(field, { target: { value: 'Code' } });
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(onrename).toHaveBeenCalledWith('Code');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('passes link edits on with the link\'s ID', async () => {
    const onupdatelink = vi.fn();
    render(CategoryCard, { ...props, onupdatelink });
    await fireEvent.click(screen.getByRole('button', { name: 'Actions for GitLab' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const field = screen.getByRole('textbox', { name: 'Title' });
    await fireEvent.input(field, { target: { value: 'Lab' } });
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(onupdatelink).toHaveBeenCalledWith('l2', { title: 'Lab' });
  });

  it('deletes itself, or one of its links, from their menus', async () => {
    const ondelete = vi.fn();
    const ondeletelink = vi.fn();
    render(CategoryCard, { ...props, onrename: () => {}, ondelete, ondeletelink });
    await fireEvent.click(screen.getByRole('button', { name: 'Actions for Repos' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(ondelete).toHaveBeenCalledOnce();
    await fireEvent.click(screen.getByRole('button', { name: 'Actions for GitLab' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(ondeletelink).toHaveBeenCalledWith(links[1]);
  });

  const many: Link[] = Array.from({ length: 11 }, (_, i) => ({ id: `m${i}`, title: `Page ${i}`, url: `https://example.com/${i}`, openable: true }));
  const openAll = () => fireEvent.click(screen.getByRole('button', { name: 'Open all bookmarks' }));
  const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Actions for Repos' }));

  it('opens up to 10 web links at once without asking, skipping the others', async () => {
    const onopenall = vi.fn();
    const bookmarklet: Link = { id: 'b', title: 'Bookmarklet', url: 'javascript:void 0', openable: false };
    render(CategoryCard, { ...props, links: [...many.slice(0, 10), bookmarklet], onopenall });
    await openMenu();
    await openAll();
    expect(onopenall).toHaveBeenCalledWith(many.slice(0, 10).map((link) => link.url));
    expect(screen.queryByRole('group', { name: 'Open all bookmarks' })).toBeNull();
  });

  it('asks first when there are more than 10, and opens them on confirm', async () => {
    const onopenall = vi.fn();
    render(CategoryCard, { ...props, links: many, onopenall });
    await openMenu();
    await openAll();
    expect(onopenall).not.toHaveBeenCalled();
    const confirm = screen.getByRole('group', { name: 'Open all bookmarks' });
    expect(confirm).toHaveTextContent('Open 11 tabs?');
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    await fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onopenall).toHaveBeenCalledWith(many.map((link) => link.url));
    expect(screen.queryByRole('group', { name: 'Open all bookmarks' })).toBeNull();
  });

  it('opens nothing when the question is cancelled or dismissed with Escape', async () => {
    const onopenall = vi.fn();
    render(CategoryCard, { ...props, links: many, onopenall });
    await openMenu();
    await openAll();
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('group', { name: 'Open all bookmarks' })).toBeNull();
    await openMenu();
    await openAll();
    await fireEvent.keyDown(screen.getByRole('button', { name: 'Open' }), { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Open all bookmarks' })).toBeNull();
    expect(onopenall).not.toHaveBeenCalled();
  });
});
