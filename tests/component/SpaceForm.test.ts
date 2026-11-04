import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SpaceForm from '@/components/SpaceForm.svelte';

const nameField = () => screen.getByRole('textbox', { name: 'Space name' });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('SpaceForm', () => {
  it('starts with no icon and focus on the name', () => {
    render(SpaceForm, { heading: 'New space', onsave: () => {}, oncancel: () => {} });
    expect(screen.getByRole('form', { name: 'New space' })).toBeInTheDocument();
    expect(nameField()).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'No icon' })).toBeChecked();
    expect(screen.getAllByRole('radio')).toHaveLength(31);
  });

  it('saves the chosen icon and the trimmed name', async () => {
    const onsave = vi.fn();
    render(SpaceForm, { heading: 'New space', onsave, oncancel: () => {} });
    await fireEvent.input(nameField(), { target: { value: ' Launch ' } });
    await fireEvent.click(screen.getByRole('radio', { name: '🚀' }));
    await save();
    expect(onsave).toHaveBeenCalledWith('🚀', 'Launch');
  });

  it('can only save once there is a name', async () => {
    render(SpaceForm, { heading: 'New space', onsave: () => {}, oncancel: () => {} });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await fireEvent.input(nameField(), { target: { value: '🚀' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('starts from the current icon and name when renaming', async () => {
    const onsave = vi.fn();
    render(SpaceForm, { heading: 'Rename space', emoji: '💼', name: 'Work', onsave, oncancel: () => {} });
    expect(nameField()).toHaveValue('Work');
    expect(screen.getByRole('radio', { name: '💼' })).toBeChecked();
    await fireEvent.click(screen.getByRole('radio', { name: 'No icon' }));
    await save();
    expect(onsave).toHaveBeenCalledWith(null, 'Work');
  });

  it('takes any emoji typed into the other field, or at the start of the name', async () => {
    const onsave = vi.fn();
    render(SpaceForm, { heading: 'New space', onsave, oncancel: () => {} });
    await fireEvent.input(screen.getByRole('textbox', { name: 'Other emoji' }), { target: { value: '🦀 crab' } });
    expect(screen.getByRole('radio', { name: '🦀' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Other emoji' })).toHaveValue('');
    await fireEvent.input(nameField(), { target: { value: 'Rust' } });
    await save();
    expect(onsave).toHaveBeenLastCalledWith('🦀', 'Rust');

    await fireEvent.input(nameField(), { target: { value: '🛠️ Tools' } });
    await save();
    expect(onsave).toHaveBeenLastCalledWith('🛠️', 'Tools');
  });

  it('cancels on Escape or the Cancel button', async () => {
    const oncancel = vi.fn();
    render(SpaceForm, { heading: 'New space', onsave: () => {}, oncancel });
    await fireEvent.keyDown(nameField(), { key: 'Escape' });
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(oncancel).toHaveBeenCalledTimes(2);
  });
});
