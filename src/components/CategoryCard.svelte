<script lang="ts">
  import { dragHandleZone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import type { Link } from '@/lib/tree';
  import AddLink from './AddLink.svelte';
  import Grip from './Grip.svelte';
  import InlineInput from './InlineInput.svelte';
  import LinkItem from './LinkItem.svelte';
  import Menu from './Menu.svelte';
  import { proto } from '@/lib/prototype.svelte';

  let {
    id,
    title,
    links,
    collapsed,
    ontoggle,
    onrename,
    ondelete,
    onopenall,
    onadd,
    onupdatelink,
    ondeletelink,
    onmovelink,
  }: {
    id: string;
    title: string;
    links: Link[];
    collapsed: boolean;
    ontoggle: () => void;
    /** Without these, the category can't be renamed, deleted or moved, like the "Unsorted" card. */
    onrename?: (title: string) => void;
    ondelete?: () => void;
    /** Receives the URLs to open, after asking first when there are many. */
    onopenall: (urls: string[]) => void;
    onadd: (url: string, title: string) => void;
    onupdatelink: (id: string, changes: { title?: string; url?: string }) => void;
    ondeletelink: (link: Link) => void;
    /** A link dropped into this card, to go before `before`, or at the end without it. */
    onmovelink: (id: string, before: string | undefined) => void;
  } = $props();

  // Follows the dragged link around, until the move is saved and the links come back from
  // the browser.
  let rows = $derived(links);
  const FLIP_MS = 150;

  function drop({ detail }: CustomEvent<DndEvent<Link>>) {
    rows = detail.items;
    const ids = rows.map((link) => link.id);
    const index = ids.indexOf(detail.info.id);
    // The card a link was dragged out of gets the event too.
    if (index === -1) return;
    if (ids.join() === links.map((link) => link.id).join()) return;
    onmovelink(detail.info.id, ids[index + 1]);
  }

  let renaming = $state(false);

  // Opening more tabs than this at once asks first.
  const CONFIRM_OVER = 10;
  // Only web links open, the same as clicking them.
  const urls = $derived(links.filter((link) => link.openable).map((link) => link.url));
  let confirming = $state(false);

  function openAll() {
    if (urls.length > CONFIRM_OVER) confirming = true;
    else onopenall(urls);
  }

  function confirmOpen() {
    confirming = false;
    onopenall(urls);
  }

  const focus = (button: HTMLButtonElement) => button.focus();

  const items = $derived([
    ...(onrename ? [{ label: 'Rename', onselect: () => (renaming = true) }] : []),
    ...(urls.length > 0 ? [{ label: 'Open all bookmarks', onselect: openAll }] : []),
    ...(ondelete ? [{ label: 'Delete', onselect: ondelete, danger: true }] : []),
  ]);
</script>

<section class="card grip-{proto.grip} chevron-{proto.chevron}" class:collapsed>
  <div class="header">
    {#if ondelete && !renaming}
      <Grip label="Move {title}" horizontal={proto.grip === 'c'} onclick={proto.grip === 'e' ? ontoggle : undefined} />
    {/if}
    {#if renaming}
      <InlineInput
        value={title}
        label="Category name"
        onsave={(text) => {
          onrename?.(text);
          renaming = false;
        }}
        oncancel={() => (renaming = false)}
      />
    {:else}
      <h2>
        <button aria-expanded={!collapsed} aria-controls="links-{id}" onclick={ontoggle}>
          {#if proto.chevron === 'a'}
            <svg class="chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
          {:else if proto.chevron === 'b'}
            <svg class="chevron triangle" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 4.5h5L6 8z" /></svg>
          {/if}
          <span class="title">{title}</span>
          <span class="count">{links.length}</span>
          {#if proto.chevron === 'c'}
            <span class="round">
              <svg class="chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
            </span>
          {/if}
        </button>
      </h2>
      {#if items.length > 0}
        <Menu label="Actions for {title}" {items} />
      {/if}
    {/if}
  </div>
  {#if confirming}
    <!-- The listener catches Escape from the buttons inside, which are interactive. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="confirm"
      role="group"
      aria-label="Open all bookmarks"
      onkeydown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          confirming = false;
        }
      }}
    >
      <span>Open {urls.length} tabs?</span>
      <button class="primary" onclick={confirmOpen} {@attach focus}>Open</button>
      <button onclick={() => (confirming = false)}>Cancel</button>
    </div>
  {/if}
  {#if !collapsed}
    <div id="links-{id}" class="body" transition:slide={{ duration: 150 }}>
      <div class="links">
        <ul
          aria-label="Links in {title}"
          use:dragHandleZone={{
            items: rows,
            type: 'link',
            flipDurationMs: FLIP_MS,
            zoneTabIndex: -1,
            dropTargetStyle: {},
            useCursorForDetection: true,
          }}
          onconsider={({ detail }) => (rows = detail.items)}
          onfinalize={drop}
        >
          {#each rows as link (link.id)}
            <li aria-label={link.title} animate:flip={{ duration: FLIP_MS }}>
              <LinkItem {link} onupdate={(changes) => onupdatelink(link.id, changes)} ondelete={() => ondeletelink(link)} />
            </li>
          {/each}
        </ul>
        <!-- Outside the list, which may only hold links. The empty list still takes a row, so links can be dropped in. -->
        {#if rows.length === 0}
          <p class="empty">No links yet</p>
        {/if}
      </div>
      <div class="add"><AddLink {onadd} /></div>
    </div>
  {/if}
</section>

<style>
  /* Fit content sizing: as wide as the longest link, between one and two card widths. */
  .card {
    width: max-content;
    min-width: var(--card-width);
    max-width: calc(2 * var(--card-width) + 16px);
    padding: var(--card-padding);
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card);
  }
  /* Fixed sizing: the card fills its grid column. */
  :global(:root[data-sizing='fixed']) .card {
    width: auto;
    min-width: 0;
    max-width: none;
  }
  .header {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .header:not(:hover, :focus-within) > :global(:is(.menu:not(.open), .grip)) {
    opacity: 0;
  }
  /* In the card's padding, left of the chevron. */
  .grip-a .header > :global(.grip) {
    position: absolute;
    top: 50%;
    left: calc(-1 * var(--card-padding));
    width: 12px;
    transform: translateY(-50%);
  }
  /* PROTOTYPE: grip in the header, with its own space before the chevron. */
  .grip-b .header > :global(.grip) {
    flex: none;
    width: 14px;
    height: 22px;
    border-radius: 6px;
  }
  /* PROTOTYPE: grip centered on the card's top edge, shown while hovering the card. */
  .grip-c .header > :global(.grip) {
    position: absolute;
    top: calc(-1 * var(--card-padding));
    left: 50%;
    width: 32px;
    height: var(--card-padding);
    border-radius: 0 0 6px 6px;
    transform: translateX(-50%);
  }
  .grip-c .header > :global(.grip svg) {
    width: 13px;
    height: 8px;
  }
  .grip-c:hover .header > :global(.grip) {
    opacity: 1;
  }
  /* PROTOTYPE: grip on the right, before the ⋯ menu. */
  .grip-d .header > :global(.grip) {
    flex: none;
    order: 1;
    width: 16px;
    height: 22px;
    border-radius: 5px;
  }
  .grip-d .header > :global(.menu) {
    order: 2;
  }
  /* PROTOTYPE: an invisible grip over the header, leaving the ⋯ menu free. Pressing and moving
     drags the card, a click still collapses it, and Tab shows it for moving by keyboard. */
  .grip-e .header > :global(.grip) {
    position: absolute;
    inset: 0 26px 0 0;
    z-index: 1;
    width: auto;
    height: auto;
    border-radius: 6px;
    opacity: 0;
  }
  .grip-e .header > :global(.grip svg) {
    visibility: hidden;
  }
  .grip-e .header > :global(.grip:focus-visible) {
    opacity: 1;
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .grip-e .header:hover .round {
    background: var(--row-hover);
  }
  :is(.grip-b, .grip-c, .grip-d) .header > :global(.grip:hover) {
    background: var(--row-hover);
  }
  h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
  button {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 2px 4px;
    border-radius: 6px;
    text-align: left;
  }
  .chevron {
    flex: none;
    width: 12px;
    height: 12px;
    fill: none;
    stroke: var(--muted);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 150ms;
  }
  .collapsed .chevron {
    transform: rotate(-90deg);
  }
  button:hover .chevron {
    stroke: var(--fg);
  }
  /* PROTOTYPE: a filled triangle, like a file tree. */
  .chevron.triangle {
    fill: var(--muted);
    stroke-width: 1;
  }
  button:hover .chevron.triangle {
    fill: var(--fg);
  }
  /* PROTOTYPE: on the right, in a round button. Points up while open, down while collapsed. */
  .round {
    display: grid;
    flex: none;
    place-items: center;
    width: 20px;
    height: 20px;
    margin-left: 6px;
    border-radius: 50%;
  }
  button:hover .round {
    background: var(--row-hover);
  }
  .chevron-c .chevron {
    width: 14px;
    height: 14px;
    stroke-width: 1.75;
    transform: rotate(180deg);
  }
  .chevron-c.collapsed .chevron {
    transform: none;
  }
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    margin-left: auto;
    padding-left: 8px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 400;
  }
  /* The gap below the header is padding inside the sliding part, so it folds away too. */
  .body {
    padding-top: 8px;
  }
  .links {
    position: relative;
  }
  ul {
    min-height: var(--row-height);
    display: flex;
    flex-direction: column;
    gap: var(--row-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .add {
    margin-top: var(--row-gap);
  }
  .confirm {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 6px 6px 6px 10px;
    border: 1px solid var(--accent);
    border-radius: 8px;
  }
  .confirm span {
    flex: 1;
  }
  .confirm button {
    width: auto;
    height: 26px;
    padding: 0 10px;
    color: var(--muted);
  }
  .confirm button:hover {
    background: var(--row-hover);
    color: var(--fg);
  }
  .confirm .primary {
    background: var(--accent);
    color: var(--bg);
    font-weight: 600;
  }
  .confirm .primary:hover {
    background: var(--accent);
    color: var(--bg);
    filter: brightness(1.1);
  }
  .empty {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0 4px;
    color: var(--muted);
    line-height: var(--row-height);
    pointer-events: none;
  }
</style>
