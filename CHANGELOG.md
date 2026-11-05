# Changelog

How the extension changes from one version to the next. See [CONTRIBUTING.md](CONTRIBUTING.md#changelog) for how entries are written.

## Unreleased

### Features

- The new tab page shows the bookmarks in **Other Bookmarks › Workspace**. Each folder in Workspace is a space, shown as a tab in the top bar, and each folder in a space is a card of links. The Workspace folder is created on first use.
- Collapse and expand categories by clicking their header, or all of a space's categories at once. Collapsed categories stay collapsed in new tabs and in other open tabs.
- A settings panel, opened from the button at the right of the top bar, changes how the page looks: five themes (Neutral dark, Tokyo Night, Rosé Pine, Dracula and the light Rosé Pine Dawn), comfortable or compact density, link titles on one line, up to two lines or with their URL, and cards that fit their content or share a fixed column width. Settings apply to every open tab right away, and sync to other computers through the browser's add-on or extension sync.
- Create spaces with the **+** button next to the tabs, picking an icon from a grid or typing any emoji, and rename them from the **⋯** button. Add categories with **+ New category** and links with **+ Add bookmark**, where a link without a title is named after its site. Rename categories and links, or change a link's URL, from their **⋯** menu. Clearing a link's title gives it back its site name. Enter saves and Escape cancels, and every change is saved to the browser's bookmarks.
- Delete spaces, categories and links from their **⋯** menu. A message at the bottom of the page offers **Undo** for 8 seconds, which puts back what was deleted in its old place, with everything inside it and its collapsed state. Only the most recent delete can be undone.
- **Open all bookmarks** in a category's **⋯** menu opens its links in background tabs, asking first when there are more than 10.
- Drag links within a category or into another one, categories within a space, and space tabs, and the browser's bookmarks follow. Links and categories have a grip that appears on hover, over the link's icon and left of the category's name. Tabs are dragged as a whole. With the keyboard, Space on a grip or tab picks it up, the arrow keys move it, and Space drops it. The Unsorted card and tab stay where they are.
- Save the page you're on from the extension's toolbar button. The popup lets you change the title and URL and pick a category, grouped by space, starting with the one you saved to last. It says where the page is already saved, if anywhere, and still lets you save it again. After saving it shows where the page went and closes. In Firefox, the page's icon is kept and shows on the new tab page.
- Search every link in every space from the box at the right of the top bar, including links in collapsed categories. Press `/` to jump to it once the page has focus. It matches titles and sites, forgives skipped letters ("gthb" finds GitHub), ignores accents and takes words in any order. Each result shows where the link lives and its address, with the matched letters highlighted. The arrow keys pick a result, Enter opens it, Ctrl+Enter or Cmd+Enter opens it in a background tab, and Escape clears the search.
