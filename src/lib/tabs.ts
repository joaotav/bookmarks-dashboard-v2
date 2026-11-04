import { browser } from 'wxt/browser';

/** Opens each URL in a new tab behind the current one, in order. */
export async function openInBackground(urls: string[]): Promise<void> {
  for (const url of urls) await browser.tabs.create({ url, active: false });
}
