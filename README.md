# Bookmarks Dashboard

A new tab page for Firefox and Chrome that keeps the links you're currently working on in reach, organized into spaces and categories.

The links are ordinary browser bookmarks in a `Workspace` folder, so they sync with the browser's own bookmark sync and stay usable without the extension.

**Status:** in development, not yet published. The [MVP tracking issue](https://github.com/joaotav/bookmarks-dashboard-v2/issues/1) shows progress, and [CHANGELOG.md](CHANGELOG.md) lists what works so far.

## How bookmarks map to the page

```
Other Bookmarks
└── Workspace
    ├── 💼 Work                 a space, shown as a tab in the top bar
    │   ├── Repos               a category, shown as a card
    │   │   └── GitHub          a link
    │   └── Loose link          links directly in a space go in its "Unsorted" card
    └── 🏠 Home
```

The extension creates the `Workspace` folder on first use. An emoji at the start of a space's folder name becomes its tab icon.

## Development

You need Node.js 22 and npm, plus Firefox, Chrome or both.

```sh
npm install
npm run dev:firefox    # opens Firefox with the extension, reloading on changes
npm run dev            # the same in Chrome
```

The Firefox development profile is kept in `.dev-profiles/firefox`, which is git-ignored, so bookmarks you add while developing persist between runs.

| Script | What it does |
|---|---|
| `npm run build` / `build:firefox` | Production build in `.output/` |
| `npm run zip` / `zip:firefox` | Zipped build for the browser stores |
| `npm test` | Unit and component tests |
| `npm run test:e2e` | End-to-end tests in Chromium. Run `npx playwright install chromium` once first. |
| `npm run check` | Type check, tests, `npm audit`, Firefox build and `web-ext lint` |

## Documentation

- [docs/mvp-plan.md](docs/mvp-plan.md): what the MVP includes, the design, and the milestones
- [docs/adr/](docs/adr/): architecture decisions and why they were made
- [CONTRIBUTING.md](CONTRIBUTING.md): issues, branches, pull requests and the changelog

## License

[MIT](LICENSE)
