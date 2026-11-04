# 2. Manifest V3 built with WXT for Firefox and Chrome

Status: accepted, 2026-11-03

## Context

The extension should run on Firefox and Chrome. Firefox still supports Manifest V2 and Manifest V3. Chrome only supports V3.

The two browsers differ in ways that affect the build:

- The background script is an event page in Firefox and a service worker in Chrome, declared differently in the manifest.
- Firefox needs `browser_specific_settings.gecko` and rejects some Chrome-only permissions like `favicon`.
- Firefox exposes `browser.*` and Chrome exposes `chrome.*`. Both return promises in MV3.

## Decision

Use Manifest V3 for both browsers, built with WXT. WXT is a Vite-based extension framework that generates a manifest per browser from `wxt.config.ts` and the files in `entrypoints/`, runs a dev server with hot reload, and zips builds for release. Code imports `browser` from WXT, which works in both browsers.

Browser-specific code is limited to the manifest config and `lib/icons.ts`, and branches on `import.meta.env.BROWSER`.

## Consequences

- One codebase and one set of commands, with `-b firefox` selecting the Firefox build.
- Any background script must follow Chrome's service worker rules: no DOM, no state kept in memory between events, listeners registered synchronously at the top level. The MVP has no background script.
- Each milestone needs a manual check in both browsers, since the APIs have small behavioral differences.
- WXT is a dependency at build time only. It isn't shipped in the extension.

## Alternatives considered

- **Hand-written manifests and plain Vite or esbuild.** Fewer dependencies, but two manifests to keep in sync, and the dev reload loop has to be built by hand.
- **Plasmo.** Similar goals, but more opinionated and centered on React.
- **Manifest V2 for Firefox.** Works today, but would split the codebase from Chrome for no benefit to this extension.
