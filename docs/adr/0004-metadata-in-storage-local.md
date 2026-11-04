# 4. UI metadata in `storage.local`, keyed by bookmark ID

Status: accepted, 2026-11-03

## Context

Native bookmarks can't store UI state (ADR 0001). The MVP needs to store which folders are collapsed, which space was open last and, on Firefox, a favicon URL per link.

`storage.sync` would carry this state to other devices, but bookmark IDs behave differently in the two browsers:

- Firefox bookmark IDs are GUIDs, and Firefox Sync keeps them the same on every device.
- Chrome bookmark IDs are short numbers that each device assigns locally. Chrome Sync copies the bookmarks, but the same bookmark has a different ID on each device.

Metadata keyed by ID in `storage.sync` would therefore point at the wrong folders on a second Chrome device.

## Decision

Store all MVP metadata in `storage.local`, keyed by bookmark ID:

- `workspaceRootId`: the ID of the `Workspace` folder
- `collapsed`: an array of collapsed folder IDs
- `activeSpaceId`: the ID of the space tab that was open last
- `icon:<bookmarkId>`: a favicon URL, Firefox only

Entries whose bookmark no longer exists are ignored on read and pruned on startup.

## Consequences

- Collapse state is per device. That's arguably the right behavior anyway, since screen sizes differ.
- Uninstalling the extension loses this metadata, but no links. Export (ADR 0005) includes collapse state for anyone who wants to keep it.
- Undoing a delete has to move metadata from the old IDs to the recreated bookmarks' new IDs.

## Alternatives considered

- **`storage.sync` keyed by ID.** Works on Firefox, wrong on Chrome.
- **`storage.sync` keyed by folder path, like `Docs/Python`.** Works across devices in both browsers, but every rename and move has to rewrite keys, and two folders with the same path collide. Worth revisiting after the MVP if colors or other settings should follow you between devices.
