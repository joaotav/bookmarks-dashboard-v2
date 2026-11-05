<script lang="ts">
  import { iconFor, letterTile } from '@/lib/icons';
  import type { Link } from '@/lib/tree';

  let { link }: { link: Link } = $props();

  const icon = $derived(iconFor(link));
  const tile = $derived(letterTile(link));
  let failed = $state(false);
</script>

{#if icon && !failed}
  <img class="icon" src={icon} alt="" onerror={() => (failed = true)} />
{:else}
  <span class="icon tile" style:--hue={tile.hue}>{tile.letter}</span>
{/if}

<style>
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
