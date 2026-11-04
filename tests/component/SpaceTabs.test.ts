import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SpaceTabs from '@/components/SpaceTabs.svelte';
import type { Space } from '@/lib/tree';

const space = (id: string, name: string, emoji: string | null = null): Space => ({ id, name, emoji, unsorted: [], categories: [] });
const spaces = [space('s1', 'Work', '💼'), space('s2', 'Home')];

describe('SpaceTabs', () => {
  it('shows one tab per space, with its emoji', () => {
    render(SpaceTabs, { spaces, activeId: 's1', unsortedId: undefined, onselect: () => {}, onmove: () => {} });
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['💼 Work', 'Home']);
  });

  it('marks only the active space as selected', () => {
    render(SpaceTabs, { spaces, activeId: 's2', unsortedId: undefined, onselect: () => {}, onmove: () => {} });
    expect(screen.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Work/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('selects a space when its tab is clicked', async () => {
    const onselect = vi.fn();
    render(SpaceTabs, { spaces, activeId: 's1', unsortedId: undefined, onselect, onmove: () => {} });
    await fireEvent.click(screen.getByRole('tab', { name: 'Home' }));
    expect(onselect).toHaveBeenCalledWith('s2');
  });

  it('keeps the Unsorted tab last, outside the tabs that can be moved, and keeps the tab roles', () => {
    const unsorted = { ...space('w', 'Unsorted'), unsorted: [] };
    render(SpaceTabs, { spaces: [...spaces, unsorted], activeId: 's1', unsortedId: 'w', onselect: () => {}, onmove: () => {} });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['💼 Work', 'Home', 'Unsorted']);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(tabs[0]!.parentElement).toBe(tabs[1]!.parentElement);
    expect(tabs[2]!.parentElement).not.toBe(tabs[0]!.parentElement);
  });
});
