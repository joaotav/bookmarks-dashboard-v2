import { browser } from 'wxt/browser';

/** Every value each setting can take, with the label the settings panel shows for it. */
export const OPTIONS = {
  layout: { grid: 'Grid' },
  theme: {
    'neutral-dark': 'Neutral dark',
    'tokyo-night': 'Tokyo Night',
    'rose-pine': 'Rosé Pine',
    dracula: 'Dracula',
    'rose-pine-dawn': 'Rosé Pine Dawn',
  },
  density: { comfortable: 'Comfortable', compact: 'Compact' },
  titles: { 'one-line': 'One line', 'two-lines': 'Up to two lines', 'with-url': 'Title and URL' },
  sizing: { 'fit-content': 'Fit content', fixed: 'Fixed' },
} as const;

export type Settings = { [K in keyof typeof OPTIONS]: keyof (typeof OPTIONS)[K] };

export const DEFAULTS: Settings = {
  layout: 'grid',
  theme: 'neutral-dark',
  density: 'comfortable',
  titles: 'one-line',
  sizing: 'fit-content',
};

const SETTINGS_KEY = 'settings';

/**
 * Reads a stored settings object. Each missing or unknown field falls back to its default
 * on its own, so settings saved by an older or newer version still load.
 */
export function toSettings(value: unknown): Settings {
  const stored: Record<string, unknown> = typeof value === 'object' && value !== null ? { ...value } : {};
  const pick = <K extends keyof Settings>(key: K): Settings[K] => {
    const option = stored[key];
    return typeof option === 'string' && Object.hasOwn(OPTIONS[key], option) ? (option as Settings[K]) : DEFAULTS[key];
  };
  return { layout: pick('layout'), theme: pick('theme'), density: pick('density'), titles: pick('titles'), sizing: pick('sizing') };
}

export async function getSettings(): Promise<Settings> {
  return toSettings((await browser.storage.sync.get(SETTINGS_KEY))[SETTINGS_KEY]);
}

export async function setSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ [SETTINGS_KEY]: settings });
}

/**
 * The settings this computer last applied. `storage.sync` only answers asynchronously, after
 * a new tab has already drawn with the defaults, so this synchronous copy in the page's
 * `localStorage` lets it draw with the right theme from the start.
 */
export function getCachedSettings(): Settings {
  try {
    return toSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'));
  } catch {
    // Unreadable copy, or storage blocked by the browser's privacy settings.
    return DEFAULTS;
  }
}

export function cacheSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Without the copy, new tabs only start with the defaults.
  }
}

/**
 * Calls `onChange` with the new settings whenever they change, from this tab, another open
 * tab or another computer. Returns a function that stops listening.
 */
export function watchSettings(onChange: (settings: Settings) => void): () => void {
  const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === 'sync' && SETTINGS_KEY in changes) onChange(toSettings(changes[SETTINGS_KEY]!.newValue));
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
