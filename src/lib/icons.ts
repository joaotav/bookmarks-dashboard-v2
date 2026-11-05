import { browser } from 'wxt/browser';
import type { Link } from './tree';

/**
 * URL of a link's favicon, or null to show a letter tile instead.
 * Chrome serves cached icons for any page through the `favicon` permission. Firefox has no
 * equivalent, so it shows the icon saved with the link from the popup, if there is one.
 */
export function iconFor(link: Link): string | null {
  if (!link.openable) return null;
  if (import.meta.env.BROWSER !== 'chrome') return link.icon ?? null;
  const url = new URL(`chrome-extension://${browser.runtime.id}/_favicon/`);
  url.searchParams.set('pageUrl', link.url);
  url.searchParams.set('size', '32');
  return url.toString();
}

/** First letter and a stable color for a letter tile, both derived from the link's host or title. */
export function letterTile(link: Link): { letter: string; hue: number } {
  let label = link.title;
  try {
    label = new URL(link.url).hostname.replace(/^www\./, '') || label;
  } catch {
    // Not a URL; use the title.
  }
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return { letter: (label[0] ?? '?').toUpperCase(), hue: Math.abs(hash) % 360 };
}
