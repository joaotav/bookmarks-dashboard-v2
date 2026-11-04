import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SettingsPanel from '@/components/SettingsPanel.svelte';
import { DEFAULTS } from '@/lib/settings';

const open = async () => {
  await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  return screen.getByRole('dialog', { name: 'Display settings' });
};

describe('SettingsPanel', () => {
  it('starts closed', () => {
    render(SettingsPanel, { settings: DEFAULTS, onchange: () => {} });
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a group of choices for each setting, with the current ones selected', async () => {
    render(SettingsPanel, { settings: { ...DEFAULTS, theme: 'dracula' }, onchange: () => {} });
    await open();
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('group').map((group) => group.querySelector('legend')?.textContent)).toEqual([
      'Layout',
      'Theme',
      'Density',
      'Titles',
      'Card sizing',
    ]);
    expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dracula' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Neutral dark' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Comfortable' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'One line' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Fit content' })).toBeChecked();
  });

  it('reports the whole settings object when a choice changes', async () => {
    const onchange = vi.fn();
    render(SettingsPanel, { settings: DEFAULTS, onchange });
    await open();
    await fireEvent.click(screen.getByRole('radio', { name: 'Compact' }));
    expect(onchange).toHaveBeenCalledWith({ ...DEFAULTS, density: 'compact' });
  });

  it('stays open while choosing, and closes on a click outside', async () => {
    render(SettingsPanel, { settings: DEFAULTS, onchange: () => {} });
    await open();
    await fireEvent.click(screen.getByRole('radio', { name: 'Fixed' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await fireEvent.click(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on Escape and gives focus back to the settings button', async () => {
    render(SettingsPanel, { settings: DEFAULTS, onchange: () => {} });
    await open();
    screen.getByRole('radio', { name: 'Tokyo Night' }).focus();
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
  });

  it('closes when the settings button is clicked again', async () => {
    render(SettingsPanel, { settings: DEFAULTS, onchange: () => {} });
    await open();
    await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
