# 1. Native bookmarks hold the links

Status: accepted, 2026-11-03

## Context

The extension needs somewhere to keep the links and categories. The options available to a WebExtension are:

- The browser's native bookmarks through `browser.bookmarks`. It stores title, URL, folder and position, nothing else.
- `storage.local`. Any JSON shape, but the browser deletes it when the extension is uninstalled, and it doesn't sync.
- `storage.sync`. Syncs, but holds about 100 KB in total and 8 KB per item.
- IndexedDB. Scales and supports queries, but is deleted on uninstall like `storage.local` and needs the most code.

Losing the links would make the extension worse than useless. Losing UI state like which categories are collapsed is a minor annoyance.

## Decision

Links, categories and spaces live in native bookmarks, in a folder named `Workspace` under "Other Bookmarks". Each folder directly inside `Workspace` is a space, and each folder inside a space is a category. The order of folders and links is the native bookmark order, changed with `bookmarks.move()`.

Everything else, such as collapse state, lives in extension storage. See ADR 0004.

## Consequences

- Links survive uninstalling the extension and stay visible and editable in the browser's own bookmark manager.
- Firefox Sync and Chrome Sync carry the links to other devices of the same browser with no code on our side.
- The address bar's bookmark search finds workspace links too.
- The page has to react to bookmark changes made outside it, so it listens to bookmark events and refetches.
- Extra per-link data like notes or tags can't live in the bookmark itself. It goes in extension storage, keyed by bookmark ID, and can be lost on uninstall.
- Undoing a delete recreates the bookmark with a new ID, so undo must move metadata to the new ID.

## Alternatives considered

- **Everything in `storage.local`.** Full control of the schema, but one uninstall or bad migration loses every link. Needs export from day one as a safety net, and gets no sync.
- **Everything in `storage.sync`.** The quota is too small for a growing collection.
- **IndexedDB.** Same durability problem as `storage.local`, more code, and nothing in this extension needs its query features.
