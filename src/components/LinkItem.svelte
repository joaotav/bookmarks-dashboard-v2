<script lang="ts">
  import { iconFor, letterTile } from '@/lib/icons';
  import type { Link } from '@/lib/tree';

  let { link }: { link: Link } = $props();

  const icon = $derived(iconFor(link));
  const tile = $derived(letterTile(link));
  let iconFailed = $state(false);
</script>

{#snippet content()}
  {#if icon && !iconFailed}
    <img class="icon" src={icon} alt="" onerror={() => (iconFailed = true)} />
  {:else}
    <span class="icon tile" style:--hue={tile.hue}>{tile.letter}</span>
  {/if}
  <span class="title">{link.title}</span>
{/snippet}

{#if link.openable}
  <a class="link" href={link.url} title={`${link.title}\n${link.url}`}>{@render content()}</a>
{:else}
  <span class="link disabled" title={`${link.title}\n${link.url}\nOnly web links can be opened from this page.`}>
    {@render content()}
  </span>
{/if}

<style>
  .link {
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
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
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
