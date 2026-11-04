<script lang="ts">
  import { iconFor, letterTile } from '@/lib/icons';
  import { defaultTitle, toWebUrl, type Link } from '@/lib/tree';
  import Grip from './Grip.svelte';
  import InlineInput from './InlineInput.svelte';
  import Menu from './Menu.svelte';

  let {
    link,
    onupdate,
    ondelete,
  }: {
    link: Link;
    /** Renames the link or changes its URL. Without it, the link can't be edited. */
    onupdate?: (changes: { title?: string; url?: string }) => void;
    ondelete?: () => void;
  } = $props();

  const icon = $derived(iconFor(link));
  const tile = $derived(letterTile(link));
  let iconFailed = $state(false);
  let editing = $state<'title' | 'url' | null>(null);

  function saveUrl(text: string) {
    const url = toWebUrl(text);
    if (!url) return 'Enter a web address, like example.com';
    onupdate?.({ url });
    editing = null;
  }
</script>

{#snippet content()}
  {#if icon && !iconFailed}
    <img class="icon" src={icon} alt="" onerror={() => (iconFailed = true)} />
  {:else}
    <span class="icon tile" style:--hue={tile.hue}>{tile.letter}</span>
  {/if}
  <span class="text">
    <span class="title">{link.title}</span>
    <!-- Shown only with the "Title and URL" setting. The tooltip already gives the URL to screen readers. -->
    <span class="url" aria-hidden="true">{link.url.replace(/^https?:\/\//, '')}</span>
  </span>
{/snippet}

<div class="row">
  {#if editing === 'title'}
    <!-- An empty title goes back to the default, the same as adding a link without one. -->
    <InlineInput
      value={link.title}
      label="Title"
      placeholder={defaultTitle(link.url)}
      allowEmpty
      onsave={(title) => {
        onupdate?.({ title: title || defaultTitle(link.url) });
        editing = null;
      }}
      oncancel={() => (editing = null)}
    />
  {:else if editing === 'url'}
    <InlineInput value={link.url} label="URL" onsave={saveUrl} oncancel={() => (editing = null)} />
  {:else if link.openable}
    <a class="link" href={link.url} title={`${link.title}\n${link.url}`}>{@render content()}</a>
  {:else}
    <span class="link disabled" title={`${link.title}\n${link.url}\nOnly web links can be opened from this page.`}>
      {@render content()}
    </span>
  {/if}
  {#if !editing}
    <!-- Over the icon, so the rest of the link can still be dragged out to the toolbar or another window. -->
    <Grip label="Move {link.title}" />
  {/if}
  {#if onupdate && !editing}
    <Menu
      label="Actions for {link.title}"
      items={[
        { label: 'Rename', onselect: () => (editing = 'title') },
        { label: 'Edit URL', onselect: () => (editing = 'url') },
        ...(ondelete ? [{ label: 'Delete', onselect: ondelete, danger: true }] : []),
      ]}
    />
  {/if}
</div>

<style>
  .row {
    position: relative;
    display: flex;
    align-items: center;
  }
  /* The menu button sits over the end of the row and shows on hover or keyboard focus. */
  .row > :global(.menu) {
    position: absolute;
    right: 6px;
  }
  .row:not(:hover, :focus-within) > :global(:is(.menu:not(.open), .grip)) {
    opacity: 0;
  }
  /* Covers the icon and the space before the title, the whole height of the row. */
  .row > :global(.grip) {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 32px;
    height: auto;
    border-radius: 6px 0 0 6px;
    background: var(--row-hover);
  }
  .row > :global(.menu:not(.open) .toggle:not(:hover)) {
    background: var(--row-hover);
  }
  .link {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--row-height);
    padding: 0 8px;
    border-radius: 6px;
    background: var(--row);
    color: var(--fg);
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.15s;
  }
  a.link:hover {
    background: var(--row-hover);
  }
  .disabled {
    color: var(--muted);
    cursor: default;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .title,
  .url {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .url {
    display: none;
    color: var(--muted);
    font-size: 11px;
  }
  /* Titles that take more than one line make the row grow, with the icon at the top. */
  :global(:root:is([data-titles='two-lines'], [data-titles='with-url'])) .link {
    align-items: flex-start;
    height: auto;
    min-height: var(--row-height);
    padding-block: 6px;
  }
  :global(:root:is([data-titles='two-lines'], [data-titles='with-url'])) .icon {
    margin-top: 1px;
  }
  /* Level with the icon, which sits at the top of rows taller than one line. */
  :global(:root:is([data-titles='two-lines'], [data-titles='with-url'])) .row > :global(.grip) {
    align-items: start;
    padding-top: 7px;
  }
  :global(:root[data-titles='two-lines']) .title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  :global(:root[data-titles='with-url']) .url {
    display: block;
  }
  .icon {
    flex: none;
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
  .tile {
    background: hsl(var(--hue) 45% 45%);
    color: #fff;
    font: 700 10px/16px system-ui, sans-serif;
    text-align: center;
  }
</style>
