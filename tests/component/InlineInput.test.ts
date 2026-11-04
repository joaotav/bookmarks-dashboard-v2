import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import InlineInput from '@/components/InlineInput.svelte';

const setup = (onsave: (text: string) => string | void = () => {}) => {
  const save = vi.fn(onsave);
  const cancel = vi.fn();
  render(InlineInput, { value: 'Repos', label: 'Category name', onsave: save, oncancel: cancel });
  return { save, cancel, field: screen.getByRole('textbox', { name: 'Category name' }) as HTMLInputElement };
};

describe('InlineInput', () => {
  it('starts focused with the current value selected', () => {
    const { field } = setup();
    expect(field).toHaveFocus();
    expect(field.value).toBe('Repos');
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, 5]);
  });

  it('saves the trimmed text on Enter', async () => {
    const { save, cancel, field } = setup();
    await fireEvent.input(field, { target: { value: '  Code ' } });
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(save).toHaveBeenCalledWith('Code');
    expect(cancel).not.toHaveBeenCalled();
  });

  it('saves when focus leaves the field, only once', async () => {
    const { save, field } = setup();
    await fireEvent.input(field, { target: { value: 'Code' } });
    await fireEvent.keyDown(field, { key: 'Enter' });
    await fireEvent.blur(field);
    expect(save).toHaveBeenCalledOnce();
  });

  it('cancels on Escape, without saving on the blur that follows', async () => {
    const { save, cancel, field } = setup();
    await fireEvent.input(field, { target: { value: 'Code' } });
    await fireEvent.keyDown(field, { key: 'Escape' });
    await fireEvent.blur(field);
    expect(cancel).toHaveBeenCalledOnce();
    expect(save).not.toHaveBeenCalled();
  });

  it('cancels instead of saving empty or unchanged text', async () => {
    const { save, cancel, field } = setup();
    await fireEvent.input(field, { target: { value: '   ' } });
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(save).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('shows the message onsave returns and stays open', async () => {
    const { cancel, field } = setup(() => 'Not allowed');
    await fireEvent.input(field, { target: { value: 'Code' } });
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(cancel).not.toHaveBeenCalled();
  });

  it('saves an empty field when allowed, for fields with a default', async () => {
    const save = vi.fn();
    render(InlineInput, { value: 'GitHub', label: 'Title', placeholder: 'github.com', allowEmpty: true, onsave: save, oncancel: () => {} });
    const field = screen.getByRole('textbox', { name: 'Title' });
    expect(field).toHaveAttribute('placeholder', 'github.com');
    await fireEvent.input(field, { target: { value: '  ' } });
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(save).toHaveBeenCalledWith('');
  });
});
