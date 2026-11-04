<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { Link } from '@/lib/tree';
  import LinkItem from './LinkItem.svelte';

  let {
    id,
    title,
    links,
    collapsed,
    ontoggle,
  }: { id: string; title: string; links: Link[]; collapsed: boolean; ontoggle: () => void } = $props();
</script>

<section class="card" class:collapsed>
  <h2>
    <button aria-expanded={!collapsed} aria-controls="links-{id}" onclick={ontoggle}>
      <svg class="chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
      <span class="title">{title}</span>
      <span class="count">{links.length}</span>
    </button>
  </h2>
  {#if !collapsed}
    <div id="links-{id}" class="body" transition:slide={{ duration: 150 }}>
      {#if links.length > 0}
        <ul>
          {#each links as link (link.id)}
            <li><LinkItem {link} /></li>
          {/each}
        </ul>
      {:else}
        <p class="empty">No links yet</p>
      {/if}
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
  h2 {
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
  ul {
    display: flex;
    flex-direction: column;
    gap: var(--row-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .empty {
    margin: 0;
    padding: 4px;
    color: var(--muted);
  }
</style>
