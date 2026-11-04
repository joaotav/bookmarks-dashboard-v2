# 6. Display settings in `storage.sync`

Status: accepted, 2026-11-03

## Context

The new tab page has display settings: layout, theme, density, title display and card sizing. They are a handful of small values that change rarely and don't refer to any bookmark, so the per-device bookmark ID problem from ADR 0004 doesn't apply to them.

`storage.sync` works like `storage.local`, but the browser copies it to every computer where the user is signed in:

- Firefox syncs it through a Mozilla account when **Add-ons** is checked in the Sync settings, about every 10 minutes or on "Sync Now". It relies on the extension's fixed ID from `browser_specific_settings.gecko.id`. Firefox for Android doesn't sync extension data.
- Chrome syncs it when the user is signed in with sync turned on. With sync off, it behaves like `storage.local`.
- Both browsers limit it to 100 KB in total and 8 KB per item. Chrome also allows at most 1,800 writes per hour.

## Decision

Store the display settings as one `settings` object in `storage.sync`.

For Chrome, set the manifest's `key` field so the extension has the same ID on every computer. An unpacked extension otherwise gets an ID derived from its folder path, which differs between computers and stops sync from matching them up.

## Consequences

- Changing the theme or layout on one computer reaches the others within minutes, with no code beyond choosing the storage area.
- Without a signed-in account, settings stay on that computer. Nothing else changes.
- The settings object is a few dozen bytes and written only when the user changes a setting, far below every quota.
- Generating and keeping the Chrome `key` is a one-time setup step. Publishing to the Chrome Web Store would make it unnecessary.

## Alternatives considered

- **`storage.local`.** Settings per computer. Useful only if different screens need different settings, which isn't expected.
