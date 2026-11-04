import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LinkItem from '@/components/LinkItem.svelte';
import type { Link } from '@/lib/tree';

const web: Link = { id: 'l1', title: 'GitHub', url: 'https://github.com/', openable: true };

describe('LinkItem', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('renders a web link that opens its URL', () => {
    render(LinkItem, { link: web });
    const anchor = screen.getByRole('link', { name: 'GitHub' });
    expect(anchor).toHaveAttribute('href', 'https://github.com/');
    expect(anchor).toHaveAttribute('title', 'GitHub\nhttps://github.com/');
  });

  it('has the URL without its scheme ready for the "Title and URL" setting, hidden from screen readers', () => {
    render(LinkItem, { link: web });
    expect(screen.getByText('github.com/')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link')).toHaveAccessibleName('GitHub');
  });

  it('shows other links as plain text that cannot be clicked', () => {
    render(LinkItem, { link: { id: 'l2', title: 'Bookmarklet', url: 'javascript:alert(1)', openable: false } });
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Bookmarklet').closest('[title]')).toHaveAttribute(
      'title',
      expect.stringContaining('Only web links can be opened'),
    );
    expect(document.querySelector('[href]')).toBeNull();
  });

  it('shows HTML in a title as text instead of rendering it', () => {
    render(LinkItem, { link: { ...web, title: '<img src=x onerror=alert(1)><b>bold</b>' } });
    expect(screen.getByRole('link')).toHaveTextContent('<img src=x onerror=alert(1)><b>bold</b>');
    expect(document.querySelector('b')).toBeNull();
  });

  it('shows the favicon on Chrome, and a letter tile if it fails to load', async () => {
    render(LinkItem, { link: web });
    const icon = document.querySelector('img')!;
    expect(icon.src).toContain('/_favicon/?pageUrl=https%3A%2F%2Fgithub.com%2F');
    await fireEvent.error(icon);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('shows a letter tile on Firefox', () => {
    vi.stubEnv('BROWSER', 'firefox');
    render(LinkItem, { link: web });
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('G')).toBeInTheDocument();
  });
});
