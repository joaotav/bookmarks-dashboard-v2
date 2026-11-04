import { isFolder, isLink, type BookmarkNode } from './node';

export interface Link {
  id: string;
  title: string;
  url: string;
  /** Only http and https links are clickable. Others, like javascript: bookmarklets, are shown as text. */
  openable: boolean;
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

function toLink(node: { id: string; title: string; url: string }): Link {
  return { id: node.id, title: node.title || node.url, url: node.url, openable: isOpenable(node.url) };
}

function directLinks(folder: BookmarkNode): Link[] {
  return (folder.children ?? []).filter(isLink).map(toLink);
}

/** Links anywhere inside a folder, in order. Subfolders of a category are shown flattened. */
function allLinks(folder: BookmarkNode): Link[] {
  return (folder.children ?? []).flatMap((child) =>
    isFolder(child) ? allLinks(child) : isLink(child) ? [toLink(child)] : [],
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

/**
 * Converts the Workspace folder's subtree into spaces. Each folder in Workspace is a space,
 * each folder in a space is a category. Links directly in Workspace go to an extra
 * "Unsorted" space at the end, which uses the Workspace folder's own ID.
 */
export function toSpaces(workspace: BookmarkNode): Space[] {
  const spaces: Space[] = (workspace.children ?? []).filter(isFolder).map((folder) => ({
    id: folder.id,
    ...splitEmoji(folder.title),
    unsorted: directLinks(folder),
    categories: (folder.children ?? [])
      .filter(isFolder)
      .map((category) => ({ id: category.id, title: category.title, links: allLinks(category) })),
  }));

  const loose = directLinks(workspace);
  if (loose.length > 0) spaces.push({ id: workspace.id, name: UNSORTED, emoji: null, unsorted: loose, categories: [] });
  return spaces;
}
