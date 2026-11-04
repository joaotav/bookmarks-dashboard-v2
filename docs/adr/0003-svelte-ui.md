# 3. Svelte 5 for the UI

Status: accepted, 2026-10-24

## Context

The new tab page has several kinds of interactive state: collapsed categories, inline editing, drag and drop, search results with keyboard selection, and an undo toast. Updating the DOM for all of that by hand gets error-prone, so a UI framework is worth having.

The page renders on every new tab, so it should load fast. Every dependency is also code that has to be trusted, so fewer is better.

## Decision

Use Svelte 5 through WXT's `@wxt-dev/module-svelte`.

## Consequences

- Svelte compiles components to plain JavaScript at build time. The shipped runtime is small and has no dependencies of its own.
- A component is one `.svelte` file of HTML, CSS and script, which is close to plain web code.
- Transitions and list animations are built in, which covers collapsing categories and items sliding when reordered.
- Text is escaped by default. Raw HTML needs `{@html}`, which this project doesn't use.
- The ecosystem is smaller than React's. The two libraries this project needs are covered: `svelte-dnd-action` for drag and drop is built for Svelte, and `@leeoniya/ufuzzy` for search doesn't depend on any framework.

## Alternatives considered

- **React.** Largest ecosystem and the most examples. More boilerplate for the same component, a larger runtime, and animations need a library.
- **SolidJS.** Small and fast, but a smaller ecosystem than either Svelte or React.
- **No framework.** No dependency, but collapse, inline edit and drag state would need hand-written DOM updates.
