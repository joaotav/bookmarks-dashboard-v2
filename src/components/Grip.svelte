<script lang="ts">
  import { dragHandle } from 'svelte-dnd-action';

  // PROTOTYPE: `horizontal` lays the dots out sideways, for the grip on a card's top edge.
  let { label, horizontal = false }: { label: string; horizontal?: boolean } = $props();
</script>

<!-- svelte-dnd-action makes it a button that takes focus, and starts a drag with Space. -->
<span class="grip" class:horizontal aria-label={label} use:dragHandle>
  {#if horizontal}
    <svg viewBox="0 0 16 10" aria-hidden="true">
      {#each [3, 8, 13] as x (x)}
        <circle cx={x} cy="2.5" r="1.4" />
        <circle cx={x} cy="7.5" r="1.4" />
      {/each}
    </svg>
  {:else}
    <svg viewBox="0 0 10 16" aria-hidden="true">
      {#each [3, 8, 13] as y (y)}
        <circle cx="2.5" cy={y} r="1.4" />
        <circle cx="7.5" cy={y} r="1.4" />
      {/each}
    </svg>
  {/if}
</span>

<style>
  .grip {
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    color: var(--muted);
    touch-action: none;
  }
  .grip:hover {
    color: var(--fg);
  }
  svg {
    width: 10px;
    height: 16px;
    fill: currentColor;
  }
  .horizontal svg {
    width: 16px;
    height: 10px;
  }
</style>
