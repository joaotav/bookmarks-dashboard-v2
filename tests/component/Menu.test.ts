import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Menu from '@/components/Menu.svelte';

const setup = () => {
  const rename = vi.fn();
  render(Menu, { label: 'Actions for Repos', items: [{ label: 'Rename', onselect: rename }] });
  return { rename, toggle: screen.getByRole('button', { name: 'Actions for Repos' }) };
};

describe('Menu', () => {
  it('shows its items only when opened', async () => {
    const { toggle } = setup();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
    await fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
  });

  it('runs the chosen item and closes', async () => {
    const { rename, toggle } = setup();
    await fireEvent.click(toggle);
    await fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    expect(rename).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
  });

  it('closes on a click outside, and on Escape with focus back on its button', async () => {
    const { toggle } = setup();
    await fireEvent.click(toggle);
    await fireEvent.click(document.body);
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();

    await fireEvent.click(toggle);
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
    expect(toggle).toHaveFocus();
  });
});
