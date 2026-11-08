# Bookmarks Dashboard

A new tab page for Firefox and Chrome that keeps the links you're currently working on in reach, organized into spaces and categories.

The links are ordinary browser bookmarks in a `Workspace` folder, so they sync with the browser's own bookmark sync and stay usable without the extension.

[CHANGELOG.md](CHANGELOG.md) lists what each version can do.

## Install

Download the files from the [latest release](https://github.com/joaotav/bookmarks-dashboard-v2/releases/latest).

### Firefox

1. Download the `.xpi` file and open it in Firefox, for example by dragging it onto a Firefox window.
2. Click **Add**. Firefox installs it like any add-on, and it stays after restarts. It's signed by Mozilla but not listed on addons.mozilla.org, so updates are installed the same way.
3. Open a new tab. If Firefox asks whether to keep the new tab page the extension set, choose **Keep changes**.

### Chrome

1. Download the `-chrome.zip` file and unzip it into a folder you'll keep, since Chrome loads the extension from there.
2. Open `chrome://extensions`, turn on **Developer mode** at the top right, click **Load unpacked** and pick the folder.
3. Open a new tab. If Chrome asks whether to keep the new tab page, keep it.

The extension stays loaded after restarts. To update, replace the folder's contents with a newer release and click the reload button on the extension's card.

Display settings sync through the browser's own sync: in Firefox when **Add-ons** is checked in the sync settings, and in Chrome when sync is on. The bookmarks themselves sync like any other bookmarks.

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
