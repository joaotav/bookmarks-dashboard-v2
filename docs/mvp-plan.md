# MVP plan

Status: draft, 2026-10-24

A browser extension that replaces the new tab page with a dashboard of the links for whatever I'm working on right now. It runs on Firefox and Chrome from one codebase.

## Goals

- Opening a new tab shows my working links, grouped into categories.
- Spaces, shown as tabs, separate categories by context, such as work or a side project.
- Categories collapse and expand, and the state sticks.
- Categories and links can be rearranged by dragging, including moving a link to another category.
- Saving the current page takes two clicks.
- A fuzzy search finds any link by title or site.
- Links are never lost to an extension bug or an uninstall.
- Moving the workspace between Firefox and Chrome works through the browsers' own bookmark import.

## Non-goals for the MVP

These are listed under [After the MVP](#after-the-mvp) and the design shouldn't block them:

- Archiving spaces that are done
- Per-bookmark notes and tags
- Right-click "save to category" menu
- Ranking by frecency from browser history
- Syncing UI state across devices
- Live sync between Firefox and Chrome
- JSON export and import of the workspace
- Board and Masonry layouts

## Decisions

| ADR | Decision | Status |
|---|---|---|
| [0001](adr/0001-native-bookmarks-hold-links.md) | Links live in the browser's native bookmarks, in a `Workspace` folder | accepted |
| [0002](adr/0002-wxt-mv3-cross-browser.md) | Manifest V3 built with WXT for Firefox and Chrome | accepted |
| [0003](adr/0003-svelte-ui.md) | Svelte 5 for the UI | accepted |
| [0004](adr/0004-metadata-in-storage-local.md) | UI metadata lives in `storage.local`, keyed by bookmark ID | accepted |
| [0005](adr/0005-json-export-import.md) | JSON export/import to move between browsers | accepted, after the MVP |
| [0006](adr/0006-display-settings-in-storage-sync.md) | Display settings live in `storage.sync` | accepted |

The rest of this plan assumes the proposed decisions and changes if any of them do.

## Layout

Settled with the throwaway prototype `prototypes/new-tab-layout.prototype.html`, kept on the `prototype/new-tab-layout` branch.

```
┌──────────────────────────────────────────────────────────────────┐
│ (💼 Work) 🔬 Research  🛠️ Side projects  +    [Search all spaces /] ⚙│
├──────────────────────────────────────────────────────────────────┤
│ ┌▾ Daily  5┐ ┌▾ Repos 10┐ ┌▾ Docs   3┐ ┌▾ Meetings 2┐            │
│ │ link     │ │ link     │ │ link     │ │ link       │            │
│ │ link     │ │ link     │ │ + Add    │ │ + Add      │            │
│ │ + Add    │ │ ...      │ └──────────┘ └────────────┘            │
│ └──────────┘ └──────────┘                                        │
└──────────────────────────────────────────────────────────────────┘
```

- A top bar holds the space tabs on the left, then a "+" button for a new space. The search box and a settings button sit on the right.
- Space tabs are a pill-style segmented control: a rounded track with the active tab as a raised pill that slides to the tab you click. Each tab shows an optional emoji before the space name. There are no link counts on tabs.
- Creating or renaming a space offers a grid of about 30 emoji plus "no icon", and accepts any emoji typed or pasted. The emoji is stored in the folder name, see [Data model](#data-model).
- The active space's categories are cards in a grid. Cards fill a row left to right, then wrap. Each row is as tall as its tallest card. Grid is the default layout. Board and Masonry come after the MVP as layout settings. Masonry moves cards between columns when heights change, which fights drag and drop, so it may be dropped. The board hides categories past the right edge of the screen.
- Each card has a header with a collapse chevron, the category name and its link count, then its links, then "+ Add bookmark".
- Categories are flat. There are no subgroups inside a category.

### Display settings

A settings panel lets the user change how the page looks. The MVP ships the Grid layout only. Board and Masonry come after the MVP.

| Setting | Options |
|---|---|
| Theme | Tokyo Night, Rosé Pine, Dracula, Neutral dark, Rosé Pine Dawn (light) |
| Density | Comfortable, Compact |
| Titles | One line, up to two lines, title + URL |
| Card sizing | Fixed: cards share a column width. Fit content: each card is as wide as its longest link, between the card width and twice that. Masonry always uses fixed. |

The card width is one value, 260px to start, tuned once the real page exists. There is no setting for it and no way to widen a single card. Long titles are handled by fit content, or by the two-line title option in fixed mode.

Defaults for a fresh install: Grid, Neutral dark, Comfortable, fit content, one-line titles.

Settings sync across computers through `storage.sync` (ADR 0006).

## Stack

| Piece | Choice | Notes |
|---|---|---|
| Build | WXT 0.21 | Generates both manifests, dev server with hot reload, zips for release |
| UI | Svelte 5 via `@wxt-dev/module-svelte` | |
| Language | TypeScript | |
| Drag and drop | `svelte-dnd-action` | No dependencies, supports dragging between lists and keyboard dragging |
| Search | `@leeoniya/ufuzzy` | No dependencies, fast on thousands of items |
| Tests | Vitest with WXT's `WxtVitest` plugin | |
| Styling | Plain CSS with custom properties | No CSS framework, light and dark from `prefers-color-scheme` |
| Package manager | npm | Lockfile committed, CI and fresh clones use `npm ci` |

Runtime dependencies are `svelte`, `svelte-dnd-action` and `@leeoniya/ufuzzy`. Anything new needs a reason in the commit message.

## Data model

### In native bookmarks

```
Other Bookmarks/                 Firefox: unfiled_____   Chrome: folderType "other"
  Workspace/                     the root, its ID saved in storage.local
    Work/                        space, shown as a tab
      Daily/                     category, shown as a card
        Gmail                    link
      Repos/
    Side projects/
      bookmarks-dashboard/
```

- A space is any folder directly inside `Workspace`. A category is any folder directly inside a space.
- A space's emoji is the start of its folder name: the folder `💼 Work` shows as the tab "Work" with the 💼 icon. `lib/tree.ts` splits off a leading emoji using `Intl.Segmenter` and the `\p{Extended_Pictographic}` regex class, so emoji made of several code points stay whole. The icon syncs and survives an uninstall along with the folder, and also appears in the browser's bookmarks menu.
- Links directly inside a space, outside any category, render in an "Unsorted" card first in the grid.
- Links directly inside `Workspace`, outside any space, render in an "Unsorted" tab.
- The UI never creates folders inside a category. If one exists because it was made in the browser's own bookmark manager, its links show in the category card as if they were directly inside it.
- Firefox separators are skipped.

### In `storage.local`

| Key | Value | Written by |
|---|---|---|
| `workspaceRootId` | bookmark ID of `Workspace` | first run |
| `collapsed` | `string[]` of folder IDs that are collapsed | collapse toggle |
| `activeSpaceId` | folder ID of the last selected space | tab click |
| `icon:<bookmarkId>` | favicon URL captured when saving (Firefox only) | popup |
| `lastCategoryId` | folder ID of the category the popup saved to last | popup |

Metadata whose bookmark no longer exists is ignored when read and pruned on startup.

### In `storage.sync`

| Key | Value | Written by |
|---|---|---|
| `settings` | `{ layout, theme, density, titles, sizing }` | settings panel |

A missing or partial `settings` object falls back to the defaults field by field, so adding a setting later needs no migration.

The new tab page also keeps a copy of the last applied settings in its own `localStorage`. Unlike `storage.sync`, it can be read before the page first draws, so new tabs open with the right theme instead of flashing the default. `storage.sync` stays the source of truth and overwrites the copy when they differ.

### View model

The UI never touches `BookmarkTreeNode` directly. `lib/tree.ts` converts the subtree into:

```ts
type Folder = { kind: "folder"; id: string; title: string; collapsed: boolean; children: Node[] };
type Link = { kind: "link"; id: string; title: string; url: string; openable: boolean };
type Node = Folder | Link;
```

`openable` is true only for `http:` and `https:` URLs. Anything else, like `javascript:` bookmarklets or Firefox `place:` queries, renders as plain text that can't be clicked.

## Finding or creating the root folder

Runs every time the new tab page loads, before rendering:

1. Read `workspaceRootId` and call `bookmarks.get()` on it. If it exists and is a folder, use it.
2. Otherwise `bookmarks.search({ title: "Workspace" })` and keep folders only. If any exist, use the first and save its ID. This avoids creating a duplicate when Firefox Sync or Chrome Sync already brought one over.
3. Otherwise create `Workspace` under the "other bookmarks" folder, chosen by `pickOtherBookmarksFolder(tree)`:
   - Chrome 134+: the root child with `folderType === "other"`, preferring one with `syncing === true`. Chrome can show both a local and an account copy of the permanent folders.
   - Firefox: the child with ID `unfiled_____`.
   - Fallback: the second child of the root, which is "Other Bookmarks" in older Chrome.

`pickOtherBookmarksFolder` is a pure function of the tree so it can be unit-tested with fixture trees from both browsers.

## Live updates

The new tab page subscribes to `bookmarks.onCreated`, `onRemoved`, `onChanged` and `onMoved`, plus `onChildrenReordered` where the browser has it. Any event triggers a refetch of the whole `Workspace` subtree, debounced by 50 ms. A sync burst then causes one refetch, and two open new tab pages stay consistent with each other and with the browser's bookmark manager. It also subscribes to `storage.onChanged` for collapse state.

Refetching the whole subtree is fast enough for a few thousand links. Diffing individual events is more code and isn't worth it at this size.

## Permissions

| Permission | Browsers | Why |
|---|---|---|
| `bookmarks` | both | read and write the workspace |
| `storage` | both | metadata in `storage.local`, settings in `storage.sync` |
| `activeTab` | both | the popup reads the current tab's URL, title and favicon |
| `favicon` | Chrome only | load cached icons from `_favicon/` |

No host permissions. The new tab page doesn't fetch anything from the network.

Firefox also needs `browser_specific_settings.gecko.id` set to a fixed ID. Without it, every temporary load during development gets a new ID and `storage.local` starts empty each time. AMO also requires new extensions to declare `data_collection_permissions` there, which for this extension is `{ "required": ["none"] }`. Verify that requirement when packaging in milestone 8.

The `favicon` permission must not appear in the Firefox manifest. The WXT manifest config is a function of the target browser, so this is one `if`.

## Favicons

`lib/icons.ts` exposes `iconFor(link): string | null`.

- Chrome returns `browser.runtime.getURL("/_favicon/") + "?pageUrl=" + encodeURIComponent(url) + "&size=32"`. This works for every bookmark, including ones created outside the extension.
- Firefox returns the `icon:<id>` value saved by the popup, or `null`.
- `null` renders a tile with the first letter of the site's hostname and a color derived from the hostname.

On Firefox, a saved `favIconUrl` may be an `https:` URL. The `<img>` then loads from that site on each new tab, mostly from the browser cache. Accepted for the MVP.

## Security

- Svelte escapes all text by default. No `{@html}` anywhere in the codebase.
- Only `http:` and `https:` links are clickable, enforced in `lib/tree.ts` and covered by tests.
- MV3's default Content Security Policy blocks inline scripts and `javascript:` URLs on extension pages. Don't loosen it.
- Dependencies: keep the list short, commit `package-lock.json`, run `npm audit` as part of `npm run check`.

## Code layout

```
src/
  entrypoints/
    newtab/          index.html, main.ts, App.svelte
    popup/           index.html, main.ts, App.svelte
  components/        CategoryCard, LinkItem, SaveForm, SpaceTabs, SearchBox, SettingsPanel, Toast, ...
  lib/
    bookmarks.ts     thin wrapper over browser.bookmarks: ensureRoot, getWorkspace, create, update, move, subscribe
    node.ts          bookmark node shape shared by both browsers, isFolder, isLink                (pure)
    tree.ts          BookmarkTreeNode to view model, URL safety, space emoji   (pure)
    root.ts          pickOtherBookmarksFolder                                  (pure)
    meta.ts          collapsed state, last used category and saved icons in storage.local
    settings.ts      display settings in storage.sync, with defaults
    icons.ts         iconFor, per browser
    search.ts        uFuzzy index and ranking                                  (pure)
    save.ts          read the active tab and save it, for the popup
    tabs.ts          open links in background tabs
    undo.ts          remove a subtree with a snapshot, and restore it
tests/
  unit/              Vitest, one file per module in src/lib
  component/         Vitest + Testing Library, one file per component
  e2e/               Playwright, one file per feature
  fixtures/          sample bookmark trees and an in-memory browser.bookmarks
public/icon/         extension icons, placeholders from the WXT template for now
wxt.config.ts
```

No background script in the MVP. Everything happens in the new tab page and the popup. The right-click menu after the MVP will need one.

## Testing

Three layers, each in its own folder under `tests/`:

| Layer | Folder | Runs in | What it covers |
|---|---|---|---|
| Unit | `tests/unit/` | Vitest, Node | Everything in `src/lib/`: tree conversion, finding and creating the Workspace folder, stored metadata, icons |
| Component | `tests/component/` | Vitest, jsdom, Testing Library | One Svelte component at a time: what it renders, what clicks do, accessibility attributes, text escaping |
| End-to-end | `tests/e2e/` | Playwright, Chromium | The built extension in a real browser: bookmarks created through the API show up, collapse state persists and syncs between tabs |

- `tests/fixtures/` holds shared sample trees (Firefox, Chrome with and without account folders, Chrome before 134) and an in-memory `browser.bookmarks`. WXT's fake browser (`@webext-core/fake-browser`) implements `storage` but not `bookmarks`.
- `tests/component/setup.ts` fills in browser APIs jsdom lacks: `Element.animate` for Svelte transitions and `document.fonts`.
- End-to-end tests load `.output/chrome-mv3` into Playwright's Chromium with a fresh profile per test. Branded Chrome ignores `--load-extension`, Playwright's Chromium doesn't. The extension has no background script, so the tests compute its ID from the folder path the way Chrome does.
- Firefox can't open extension pages under automation, so each milestone ends with a short manual check in Firefox.
- `npm test` runs unit and component tests. `npm run test:e2e` builds the Chrome extension and runs the end-to-end tests. `npm run check` runs `svelte-check`, the Vitest tests, `npm audit` and `web-ext lint` on the Firefox build.

## Milestones

Each milestone ends in a working extension in both browsers, merged into `main` through its own PR. Progress is tracked in the [MVP tracking issue](https://github.com/joaotav/bookmarks-dashboard-v2/issues/1), which has one sub-issue per milestone. M0 to M2 were done before the tracking issue existed, in `602162d`, `4d3e9f9` and `7c526aa`.

### M0. Scaffold

- WXT project with the Svelte module and TypeScript, `newtab` and `popup` entrypoints showing placeholder text.
- `wxt.config.ts` with per-browser manifests, the gecko ID and permissions.
- Scripts `dev`, `dev:firefox`, `build`, `build:firefox`, `zip`, `zip:firefox`, `check`.

Verify: `npm run dev` opens Chrome and a new tab shows the placeholder. Same for `npm run dev:firefox`. `npm run check` passes.

### M1. Read-only workspace

- `ensureRoot` as described above, with `pickOtherBookmarksFolder` unit-tested.
- Render the top bar with space tabs, and the active space's categories as cards in the grid described under [Layout](#layout). Links show favicons or letter tiles. "Unsorted" card and tab, empty state for a new `Workspace`.
- Remember the active space in `activeSpaceId`.
- Live updates.

Verify: in the browser's bookmark manager, add a space folder, a category folder inside it and a link inside that. All three appear on an open new tab without reloading. Remove them, they disappear.

### M2. Collapse and expand

- Click a category header or its chevron to toggle. Animate with Svelte's `slide` transition.
- Persist to `collapsed` in `storage.local`. "Collapse all" and "Expand all" buttons.

Verify: collapse a category, open a new tab, it's still collapsed. A collapsed state in one open tab updates the other open tab.

### M3. Display settings

- Gear button in the top bar opens a settings panel with theme, density, titles and card sizing, as listed under [Display settings](#display-settings). Layout shows Grid only until Board and Masonry exist.
- Themes are sets of CSS custom properties selected by a `data-theme` attribute. Density, titles and sizing work the same way.
- Read and write `settings` in `storage.sync`, and apply changes from `storage.onChanged` so other open tabs update.

Verify: change every setting, open a new tab, the choices stuck. On a second computer signed in to the same account, with Add-ons sync on, the settings arrive after a "Sync Now".

### M4. Create, edit, delete

- New space from the "+" tab. Rename and delete a space from its tab.
- New category button. Add link form inside a category with URL and optional title. The title defaults to the URL's hostname.
- Inline rename for categories and links, inline URL edit for links. Enter saves, Escape cancels.
- Delete with an undo toast lasting 8 seconds. Undo recreates the snapshotted subtree at its original position and moves its `collapsed` and `icon:` metadata to the new IDs. Only the most recent delete is undoable.
- "Open all" on a category opens its links in new background tabs, asking first if there are more than 10.

Verify: delete a category with nested links, undo, the structure and collapse state are back. Rename shows up in the browser's bookmark manager.

### M5. Drag and drop

- Drag categories to reorder them within a space. Drag links within a category and between categories. Drag space tabs to reorder them.
- `svelte-dnd-action` updates the UI right away. On drop, call `bookmarks.move()`. The resulting event refetches and settles the real state.
- Category zones and link zones use different `type` values so a category can't be dropped into a link list.
- Keyboard dragging works through `svelte-dnd-action`'s built-in support.

Verify: move a link down within its own category, then up, then into another category, in both browsers. The browser's bookmark manager shows the same order. Write down whether `bookmarks.move()` index semantics differ between Firefox and Chrome when moving down within the same parent, and handle it in `lib/bookmarks.ts` if they do.

### M6. Save the current page

- Toolbar popup reads the active tab, shows an editable title and a category picker with entries like "Work › Repos", and saves. The last used category is preselected.
- On Firefox, store `tab.favIconUrl` as `icon:<newId>` when it's `https:` or `data:`.
- If the URL is already in `Workspace`, the popup says which category it's in.

Verify: save a page from each browser. It appears on an open new tab. On Firefox, it shows the site's icon.

### M7. Search

- Search box on the right of the top bar. `/` focuses it once the page has focus.
- uFuzzy over `title + " " + hostname` for every link in every space, including collapsed categories. Results appear in a dropdown under the search box, each showing where the link lives, like "Work › Repos".
- Arrow keys move the selection. Enter opens in the current tab, Ctrl+Enter or Cmd+Enter in a background tab, Escape clears the search.
- Matched characters are highlighted.

A browser limitation: when a new tab opens, both browsers keep focus in the address bar, and an extension page can't take it. Click the page or press Tab, then `/`. The address bar's own bookmark search (`*` in Firefox, `@bookmarks` in Chrome) also covers the workspace because the links are native bookmarks.

Verify: unit tests for ranking on a fixture set. Manual check that "gthb" finds "GitHub".

### M8. Packaging

- Firefox: sign as an unlisted add-on on AMO with `web-ext sign --channel=unlisted` and install the signed `.xpi`.
- Chrome: load the unpacked build from `.output/chrome-mv3`, which survives restarts. A Web Store listing is optional. Set the manifest `key` so the extension ID is the same on every computer, which `storage.sync` needs (ADR 0006).
- README with build and install steps for both browsers.

Verify: install the signed Firefox build and restart Firefox. The extension is still there with its data.

## Open questions and risks

- `bookmarks.move()` index semantics when moving within the same parent. Checked in M5: they differ. Chrome counts the index with the moved item still in its old place, Firefox counts it without, so moving down within the same folder lands one place further in Firefox. `move()` in `lib/bookmarks.ts` takes the bookmark to go before and subtracts one in Firefox.
- Whether `activeTab` exposes `favIconUrl` to the popup in Firefox. Checked in M6. If it doesn't, Firefox falls back to letter tiles.
- `svelte-dnd-action` with zones nested inside other zones. Checked in M5: works with drag handles, since an item inside another item starts its own drag only.
- The name `Workspace` is hardcoded. If a folder with that name already exists, the extension adopts it. Acceptable for the MVP.

## After the MVP

Roughly in priority order:

1. Archive: move a finished space into an `Archive` folder that doesn't show as a tab, and restore it later.
2. Right-click "Save to category" menu. Needs a background script that rebuilds the menu on bookmark changes.
3. Frecency ranking from `history.getVisits()`, used to sort search results and optionally to fade unused links.
4. Per-bookmark notes, included in search and export.
5. Save all tabs in the window as a new category. Needs the `tabs` permission.
6. Keyboard shortcut to open the popup through the `commands` API.
7. Collapse state and colors that follow you across devices, keyed by folder path in `storage.sync`.
8. JSON export and import of the workspace with its collapse state, as described in ADR 0005.
9. Board layout, with fit content and fixed sizing.
10. Masonry layout, always fixed sizing. Drop it if dragging cards feels unpredictable.
