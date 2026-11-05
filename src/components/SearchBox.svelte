<script lang="ts">
  import { createSearch, type Result } from '@/lib/search';
  import type { Space } from '@/lib/tree';
  import LinkIcon from './LinkIcon.svelte';

  let {
    spaces,
    onopen,
  }: {
    spaces: Space[];
    /** Opens a result here, or in a background tab, which keeps the search open. */
    onopen: (url: string, background: boolean) => void;
  } = $props();

  let input: HTMLInputElement;
  let list = $state<HTMLElement>();
  let query = $state('');
  let focused = $state(false);
  let selected = $state(0);

  const search = $derived(createSearch(spaces));
  const results = $derived(search(query));
  const open = $derived(focused && query.trim() !== '');

  function choose(result: Result, background: boolean) {
    onopen(result.link.url, background);
  }

  function move(by: number) {
    if (results.length === 0) return;
    selected = (selected + by + results.length) % results.length;
    list?.children[selected]?.scrollIntoView({ block: 'nearest' });
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && open && results[selected]) {
      event.preventDefault();
      choose(results[selected]!, event.ctrlKey || event.metaKey);
    } else if (event.key === 'Escape') {
      if (query) query = '';
      else input.blur();
    }
  }

  // "/" jumps to the search box, unless it's typed into a field.
  function onWindowKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const typing = target.closest('input, textarea, select, [contenteditable]');
    if (event.key !== '/' || typing || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    input.focus();
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#snippet highlighted(parts: Result['title'])}
  {#each parts as part, i (i)}
    {#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}
  {/each}
{/snippet}

<div class="search">
  <input
    bind:this={input}
    bind:value={query}
    type="text"
    role="combobox"
    aria-label="Search all spaces"
    aria-expanded={open}
    aria-controls="search-results"
    aria-autocomplete="list"
    aria-activedescendant={open && results.length > 0 ? `search-result-${selected}` : undefined}
    placeholder="Search all spaces"
    spellcheck="false"
    autocomplete="off"
    oninput={() => (selected = 0)}
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
    {onkeydown}
  />
  {#if !query}<kbd aria-hidden="true">/</kbd>{/if}
  {#if open}
    <div class="dropdown">
      {#if results.length > 0}
        <ul id="search-results" role="listbox" aria-label="Search results" bind:this={list}>
          {#each results as result, i (result.link.id)}
            <!-- The search box keeps focus and handles the keyboard, as in any combobox. A
                 mousedown would take the focus away, closing the list before the click. -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <li
              id="search-result-{i}"
              title={result.link.url}
              role="option"
              aria-selected={i === selected}
              onmousedown={(event) => event.preventDefault()}
              onmousemove={() => (selected = i)}
              onclick={(event) => choose(result, event.ctrlKey || event.metaKey)}
              onauxclick={(event) => event.button === 1 && choose(result, true)}
            >
              <LinkIcon link={result.link} />
              <span class="text">
                <span class="title">{@render highlighted(result.title)}</span>
                <span class="where">{result.place} · {@render highlighted(result.address)}</span>
              </span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none">No links match</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .search {
    position: relative;
  }
  input {
    width: 220px;
    height: 30px;
    padding: 0 28px 0 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: none;
    background: var(--bg);
    color: var(--fg);
    font: inherit;
  }
  input:focus {
    border-color: var(--accent);
  }
  input::placeholder {
    color: var(--muted);
  }
  kbd {
    position: absolute;
    top: 50%;
    right: 8px;
    padding: 0 5px;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--muted);
    font-size: 11px;
    line-height: 16px;
    transform: translateY(-50%);
    pointer-events: none;
  }
  .dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    width: 380px;
    max-width: calc(100vw - 32px);
    padding: 6px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card);
    box-shadow: 0 12px 32px #0006;
  }
  ul {
    max-height: 60vh;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }
  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 7px 8px;
    border-radius: 6px;
    cursor: pointer;
  }
  li[aria-selected='true'] {
    background: var(--row-hover);
  }
  li > :global(.icon) {
    margin-top: 1px;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .title,
  .where {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .where {
    color: var(--muted);
    font-size: 11px;
  }
  mark {
    background: none;
    color: var(--accent);
    font-weight: 600;
  }
  .none {
    margin: 0;
    padding: 8px;
    color: var(--muted);
  }
</style>
