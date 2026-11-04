import { browser } from 'wxt/browser';

const ACTIVE_SPACE_KEY = 'activeSpaceId';

export async function getActiveSpaceId(): Promise<string | undefined> {
  const value = (await browser.storage.local.get(ACTIVE_SPACE_KEY))[ACTIVE_SPACE_KEY];
  return typeof value === 'string' ? value : undefined;
}

export async function setActiveSpaceId(id: string): Promise<void> {
  await browser.storage.local.set({ [ACTIVE_SPACE_KEY]: id });
}
