import { isFolder, isLink, type BookmarkNode } from './node';

export interface Link {
  id: string;
  title: string;
  url: string;
  /** Only http and https links are clickable. Others, like javascript: bookmarklets, are shown as text. */
  openable: boolean;
  /** The favicon saved with the link from the popup, in Firefox. */
  icon?: string;
}

export interface Category {
  id: string;
  title: string;
  links: Link[];
}

export interface Space {
  id: string;
  name: string;
  emoji: string | null;
  /** Links directly inside the space folder, outside any category. Shown as an "Unsorted" card. */
  unsorted: Link[];
  categories: Category[];
}

export const UNSORTED = 'Unsorted';

const OPENABLE_PROTOCOLS = new Set(['http:', 'https:']);

function isOpenable(url: string): boolean {
  try {
    return OPENABLE_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * Turns what the user typed into a web address, so "github.com" becomes "https://github.com/".
 * Returns null for anything that isn't an http or https address, or that carries a username
 * or password.
 */
export function toWebUrl(input: string): string | null {
  const text = input.trim();
  // A scheme like "mailto:", but not a port like "localhost:3000".
  const hasScheme = /^[a-z][a-z\d+.-]*:(?!\d)/i.test(text);
  try {
    const url = new URL(hasScheme ? text : `https://${text}`);
    return OPENABLE_PROTOCOLS.has(url.protocol) && url.hostname && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

/** The title for a link saved without one: its hostname without "www.". */
export const defaultTitle = (url: string) => new URL(url).hostname.replace(/^www\./, '');

type Icons = Map<string, string>;

function toLink(node: { id: string; title: string; url: string }, icons: Icons): Link {
  const link: Link = { id: node.id, title: node.title || node.url, url: node.url, openable: isOpenable(node.url) };
  const icon = icons.get(node.id);
  return icon ? { ...link, icon } : link;
}

function directLinks(folder: BookmarkNode, icons: Icons): Link[] {
  return (folder.children ?? []).filter(isLink).map((node) => toLink(node, icons));
}

/** Links anywhere inside a folder, in order. Subfolders of a category are shown flattened. */
function allLinks(folder: BookmarkNode, icons: Icons): Link[] {
  return (folder.children ?? []).flatMap((child) =>
    isFolder(child) ? allLinks(child, icons) : isLink(child) ? [toLink(child, icons)] : [],
  );
}

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/**
 * Splits a leading emoji off a space's folder name: "💼 Work" becomes 💼 and "Work".
 * Works on whole graphemes, so emoji made of several code points, like 🛠️ or 🇧🇷, stay intact.
 */
export function splitEmoji(title: string): { emoji: string | null; name: string } {
  const first = graphemes.segment(title)[Symbol.iterator]().next().value?.segment;
  if (first && EMOJI.test(first)) return { emoji: first, name: title.slice(first.length).trimStart() };
  return { emoji: null, name: title };
}

/** The folder name for a space: its emoji, if it has one, then its name. */
export const joinEmoji = (emoji: string | null, name: string) => (emoji ? `${emoji} ${name}` : name);

/**
 * Converts the Workspace folder's subtree into spaces. Each folder in Workspace is a space,
 * each folder in a space is a category. Links directly in Workspace go to an extra
 * "Unsorted" space at the end, which uses the Workspace folder's own ID. `icons` holds the
 * favicons saved from the popup, by bookmark ID.
 */
export function toSpaces(workspace: BookmarkNode, icons: Icons = new Map()): Space[] {
  const spaces: Space[] = (workspace.children ?? []).filter(isFolder).map((folder) => ({
    id: folder.id,
    ...splitEmoji(folder.title),
    unsorted: directLinks(folder, icons),
    categories: (folder.children ?? [])
      .filter(isFolder)
      .map((category) => ({ id: category.id, title: category.title, links: allLinks(category, icons) })),
  }));

  const loose = directLinks(workspace, icons);
  if (loose.length > 0) spaces.push({ id: workspace.id, name: UNSORTED, emoji: null, unsorted: loose, categories: [] });
  return spaces;
}

/** Where a link lives, like "Work › Repos". */
export const placeName = (space: Space, category?: Category) =>
  category ? `${space.name} › ${category.title}` : space.name === UNSORTED ? UNSORTED : `${space.name} › ${UNSORTED}`;

const sameUrl = (a: string, b: string) => {
  try {
    return new URL(a).href === new URL(b).href;
  } catch {
    return a === b;
  }
};

/** Every place in the workspace that already holds a link to `url`. */
export function placesOf(spaces: Space[], url: string): string[] {
  const has = (links: Link[]) => links.some((link) => sameUrl(link.url, url));
  return spaces.flatMap((space) => [
    ...(has(space.unsorted) ? [placeName(space)] : []),
    ...space.categories.filter((category) => has(category.links)).map((category) => placeName(space, category)),
  ]);
}
