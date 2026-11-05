import { browser } from 'wxt/browser';
import { create } from './bookmarks';
import { setIcon, setLastCategoryId } from './meta';

export interface Page {
  url: string;
  title: string;
  favIconUrl?: string;
}

/**
 * The page in the current window's active tab, or null if the browser doesn't say. Opening
 * the popup grants the `activeTab` permission, which lets it read the tab's URL and title.
 */
export async function currentPage(): Promise<Page | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  return { url: tab.url, title: tab.title ?? '', ...(tab.favIconUrl && { favIconUrl: tab.favIconUrl }) };
}

/**
 * Saves a link at the end of a category and remembers the category for next time. In Firefox,
 * which can't look up favicons later, it also keeps `favIconUrl` when it's an https: or data:
 * image. Returns the new bookmark's ID.
 */
export async function savePage(categoryId: string, { url, title, favIconUrl }: Page): Promise<string> {
  const id = await create(categoryId, title, url);
  const keepIcon = import.meta.env.BROWSER === 'firefox' && favIconUrl && /^(https:|data:image\/)/.test(favIconUrl);
  await Promise.all([setLastCategoryId(categoryId), ...(keepIcon ? [setIcon(id, favIconUrl)] : [])]);
  return id;
}
