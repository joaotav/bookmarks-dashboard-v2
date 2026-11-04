<script lang="ts">
  import type { Link } from '@/lib/tree';
  import LinkItem from './LinkItem.svelte';

  let { title, links }: { title: string; links: Link[] } = $props();
</script>

<section class="card">
  <header>
    <h2>{title}</h2>
    <span class="count">{links.length}</span>
  </header>
  {#if links.length > 0}
    <ul>
      {#each links as link (link.id)}
        <li><LinkItem {link} /></li>
      {/each}
    </ul>
  {:else}
    <p class="empty">No links yet</p>
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
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 4px 8px;
  }
  h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
  .count {
    margin-left: auto;
    color: var(--muted);
    font-size: 11px;
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
