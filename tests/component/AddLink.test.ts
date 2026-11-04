import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import AddLink from '@/components/AddLink.svelte';

const open = async () => {
  await fireEvent.click(screen.getByRole('button', { name: '+ Add bookmark' }));
  return { url: screen.getByRole('textbox', { name: 'URL' }), title: screen.getByRole('textbox', { name: 'Title' }) };
};

describe('AddLink', () => {
  it('adds a link with a normalized URL and the trimmed title, then closes', async () => {
    const onadd = vi.fn();
    render(AddLink, { onadd });
    const { url, title } = await open();
    expect(url).toHaveFocus();
    await fireEvent.input(url, { target: { value: 'github.com' } });
    await fireEvent.input(title, { target: { value: ' GitHub ' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onadd).toHaveBeenCalledWith('https://github.com/', 'GitHub');
    expect(screen.getByRole('button', { name: '+ Add bookmark' })).toBeInTheDocument();
  });

  it('passes an empty title on, so the caller can pick a default', async () => {
    const onadd = vi.fn();
    render(AddLink, { onadd });
    const { url } = await open();
    await fireEvent.input(url, { target: { value: 'https://example.com/a' } });
    await fireEvent.submit(url.closest('form')!);
    expect(onadd).toHaveBeenCalledWith('https://example.com/a', '');
  });

  it('refuses addresses that are not web pages', async () => {
    const onadd = vi.fn();
    render(AddLink, { onadd });
    const { url } = await open();
    await fireEvent.input(url, { target: { value: 'javascript:alert(1)' } });
    await fireEvent.submit(url.closest('form')!);
    expect(onadd).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a web address');
  });

  it('closes and clears on Escape or Cancel', async () => {
    render(AddLink, { onadd: () => {} });
    const { url } = await open();
    await fireEvent.input(url, { target: { value: 'github.com' } });
    await fireEvent.keyDown(url, { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: 'URL' })).toBeNull();
    await open();
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('');
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('textbox', { name: 'URL' })).toBeNull();
  });
});
