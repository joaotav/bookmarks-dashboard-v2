<script lang="ts">
  import { dragHandle } from 'svelte-dnd-action';

  let { label }: { label: string } = $props();
</script>

<!-- svelte-dnd-action makes it a button that takes focus, and starts a drag with Space. -->
<span class="grip" aria-label={label} use:dragHandle>
  <svg viewBox="0 0 10 16" aria-hidden="true">
    {#each [3, 8, 13] as y (y)}
      <circle cx="2.5" cy={y} r="1.4" />
      <circle cx="7.5" cy={y} r="1.4" />
    {/each}
  </svg>
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
</style>
