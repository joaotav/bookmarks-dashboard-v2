import { browser } from 'wxt/browser';

const ACTIVE_SPACE_KEY = 'activeSpaceId';

export async function getActiveSpaceId(): Promise<string | undefined> {
  const value = (await browser.storage.local.get(ACTIVE_SPACE_KEY))[ACTIVE_SPACE_KEY];
  return typeof value === 'string' ? value : undefined;
}

export async function setActiveSpaceId(id: string): Promise<void> {
  await browser.storage.local.set({ [ACTIVE_SPACE_KEY]: id });
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
