# 5. JSON export and import to move between browsers

Status: accepted, 2026-11-03. Deferred until after the MVP.

## Context

The extension runs on Firefox and Chrome, but only one browser is in use at a time. Firefox Sync and Chrome Sync don't exchange data, so moving the workspace from one browser to the other needs some kind of file.

Both browsers can already export and import all bookmarks as HTML, and Chrome can import bookmarks directly from a Firefox installed on the same computer. Since the links are native bookmarks (ADR 0001), that already moves the whole `Workspace` folder between browsers. It copies every bookmark, not just the workspace, may nest the folder inside an "Imported" folder, and loses collapse state.

The MVP relies on that built-in import. The format below is what the extension will add after the MVP.

## Decision

The new tab page exports the `Workspace` subtree and its collapse state as JSON, and imports the same format.

```json
{
  "format": "chickadee",
  "version": 1,
  "exportedAt": "2026-10-24T15:00:00.000Z",
  "root": {
    "type": "folder",
    "title": "Workspace",
    "collapsed": false,
    "children": [
      {
        "type": "folder",
        "title": "Docs",
        "collapsed": true,
        "children": [
          { "type": "link", "title": "WXT docs", "url": "https://wxt.dev/" }
        ]
      }
    ]
  }
}
```

The file holds no bookmark IDs, since IDs are meaningless on another device, and no favicons, which get captured again.

Import is non-destructive. If `Workspace` is empty, the import fills it. Otherwise it goes into a new category named `Imported YYYY-MM-DD`.

A hand-written validator checks the whole file before any bookmark is created:

- `format` and `version` must match
- file size at most 5 MB
- at most 10,000 links and folders nested at most 5 levels deep
- titles at most 1,000 characters
- URLs must parse and use `http:` or `https:`. Other links are skipped and counted in the import summary.

## Consequences

- Moving between browsers is export, then import, and keeps collapse state.
- The file doubles as a backup.
- The validator is a pure function with unit tests, and no schema library is added for it.
- Bumping `version` later needs an upgrade step for older files.

## Alternatives considered

- **The browsers' built-in HTML bookmark export.** Zero code, but exports every bookmark and drops collapse state. Still works as a fallback.
- **A schema library such as Zod or Valibot.** Less validator code, but one more runtime dependency for a format with six fields.
- **Live sync through a server or a GitHub gist.** Not needed when only one browser is in use at a time.
