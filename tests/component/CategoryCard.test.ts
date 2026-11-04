import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CategoryCard from '@/components/CategoryCard.svelte';
import type { Link } from '@/lib/tree';

const links: Link[] = [
  { id: 'l1', title: 'GitHub', url: 'https://github.com', openable: true },
  { id: 'l2', title: 'GitLab', url: 'https://gitlab.com', openable: true },
];
const props = { id: 'c1', title: 'Repos', links, collapsed: false, ontoggle: () => {} };

describe('CategoryCard', () => {
  it('shows the category name, its link count and its links', () => {
    render(CategoryCard, props);
    expect(screen.getByRole('heading', { name: /Repos/ })).toHaveTextContent('2');
    expect(screen.getAllByRole('link').map((a) => a.textContent?.trim())).toEqual(['GitHub', 'GitLab']);
  });

  it('says so when the category has no links', () => {
    render(CategoryCard, { ...props, links: [] });
    expect(screen.getByText('No links yet')).toBeInTheDocument();
  });

  it('toggles when the header is clicked', async () => {
    const ontoggle = vi.fn();
    render(CategoryCard, { ...props, ontoggle });
    await fireEvent.click(screen.getByRole('button', { name: /Repos/ }));
    expect(ontoggle).toHaveBeenCalledOnce();
  });

  it('tells screen readers whether it is expanded, and which element it controls', () => {
    render(CategoryCard, props);
    const header = screen.getByRole('button', { name: /Repos/ });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(header.getAttribute('aria-controls')!)).toContainElement(screen.getAllByRole('link')[0]!);
  });

  it('hides its links when collapsed', () => {
    render(CategoryCard, { ...props, collapsed: true });
    expect(screen.getByRole('button', { name: /Repos/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('link')).toEqual([]);
  });

  it('removes and restores its links when collapsed state changes', async () => {
    const { rerender } = render(CategoryCard, props);
    await rerender({ ...props, collapsed: true });
    await vi.waitFor(() => expect(screen.queryAllByRole('link')).toEqual([]));
    await rerender({ ...props, collapsed: false });
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
