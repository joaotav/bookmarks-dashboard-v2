import { browser } from 'wxt/browser';

const ACTIVE_SPACE_KEY = 'activeSpaceId';

export async function getActiveSpaceId(): Promise<string | undefined> {
  const value = (await browser.storage.local.get(ACTIVE_SPACE_KEY))[ACTIVE_SPACE_KEY];
  return typeof value === 'string' ? value : undefined;
}

export async function setActiveSpaceId(id: string): Promise<void> {
  await browser.storage.local.set({ [ACTIVE_SPACE_KEY]: id });
}

const LAST_CATEGORY_KEY = 'lastCategoryId';

/** The category the popup saved to last, preselected the next time. */
export async function getLastCategoryId(): Promise<string | undefined> {
  const value = (await browser.storage.local.get(LAST_CATEGORY_KEY))[LAST_CATEGORY_KEY];
  return typeof value === 'string' ? value : undefined;
}

export async function setLastCategoryId(id: string): Promise<void> {
  await browser.storage.local.set({ [LAST_CATEGORY_KEY]: id });
}

const ICON_PREFIX = 'icon:';

/** Favicons the popup saved in Firefox, by bookmark ID. */
export async function getIcons(): Promise<Map<string, string>> {
  const stored = await browser.storage.local.get(null);
  return new Map(
    Object.entries(stored)
      .filter(([key, value]) => key.startsWith(ICON_PREFIX) && typeof value === 'string')
      .map(([key, value]) => [key.slice(ICON_PREFIX.length), value as string]),
  );
}

export async function setIcon(id: string, url: string): Promise<void> {
  await browser.storage.local.set({ [ICON_PREFIX + id]: url });
}

/** Calls `onChange` whenever a saved favicon is added, changed or removed. Returns a function that stops listening. */
export function watchIcons(onChange: () => void): () => void {
  const listener = (changes: Record<string, unknown>, area: string) => {
    if (area === 'local' && Object.keys(changes).some((key) => key.startsWith(ICON_PREFIX))) onChange();
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

const COLLAPSED_KEY = 'collapsed';

const toIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];

/** IDs of the collapsed category folders. Spaces use their own ID for their "Unsorted" card. */
export async function getCollapsed(): Promise<string[]> {
  return toIds((await browser.storage.local.get(COLLAPSED_KEY))[COLLAPSED_KEY]);
}

export async function setCollapsed(ids: string[]): Promise<void> {
  await browser.storage.local.set({ [COLLAPSED_KEY]: ids });
}

/**
 * Calls `onChange` with the new collapsed IDs whenever they change, including from other
 * open tabs. Returns a function that stops listening.
 */
export function watchCollapsed(onChange: (ids: string[]) => void): () => void {
  const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === 'local' && COLLAPSED_KEY in changes) onChange(toIds(changes[COLLAPSED_KEY]!.newValue));
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

/**
 * Moves per-bookmark metadata to new IDs, after a deleted subtree is recreated by undo and
 * every bookmark in it gets a new ID. `ids` maps each old ID to its new one.
 */
export async function moveMeta(ids: Map<string, string>): Promise<void> {
  const iconKey = (id: string) => `icon:${id}`;
  const oldIconKeys = [...ids.keys()].map(iconKey);
  const stored = await browser.storage.local.get([COLLAPSED_KEY, ...oldIconKeys]);

  const changes: Record<string, unknown> = {
    [COLLAPSED_KEY]: toIds(stored[COLLAPSED_KEY]).map((id) => ids.get(id) ?? id),
  };
  for (const [oldId, newId] of ids) {
    if (stored[iconKey(oldId)] !== undefined) changes[iconKey(newId)] = stored[iconKey(oldId)];
  }
  await browser.storage.local.set(changes);
  await browser.storage.local.remove(oldIconKeys);
}
