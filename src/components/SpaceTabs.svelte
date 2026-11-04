<script lang="ts">
  import { onMount } from 'svelte';
  import type { Space } from '@/lib/tree';

  let {
    spaces,
    activeId,
    onselect,
  }: { spaces: Space[]; activeId: string | undefined; onselect: (id: string) => void } = $props();

  let track: HTMLElement;
  let indicator = $state({ left: 0, width: 0 });
  // Off for the first measurement, so the pill appears in place instead of sliding in from the left.
  let animated = $state(false);

  function measure() {
    const tab = track?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!tab) return;
    indicator = { left: tab.offsetLeft, width: tab.offsetWidth };
    if (!animated) requestAnimationFrame(() => (animated = true));
  }

  // Runs after the DOM updates whenever the active tab or the list of tabs changes.
  $effect(() => {
    void activeId;
    void spaces;
    measure();
  });

  onMount(() => {
    // Emoji fonts can load after the first measurement and change tab widths.
    void document.fonts.ready.then(measure);
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  });
</script>

<div class="track" role="tablist" bind:this={track}>
  <span
    class="indicator"
    class:animated
    style:width="{indicator.width}px"
    style:transform="translateX({indicator.left}px)"
  ></span>
  {#each spaces as space (space.id)}
    <button class="tab" role="tab" aria-selected={space.id === activeId} onclick={() => onselect(space.id)}>
      {#if space.emoji}<span class="emoji">{space.emoji}</span>{/if}
      <span>{space.name}</span>
    </button>
  {/each}
</div>

<style>
  .track {
    position: relative;
    display: flex;
    gap: 2px;
    padding: 3px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg);
  }
  .indicator {
    position: absolute;
    top: 3px;
    left: 0;
    height: 30px;
    border-radius: 7px;
    background: var(--row-hover);
    box-shadow: 0 1px 3px #0004;
    pointer-events: none;
  }
  .indicator.animated {
    transition:
      transform 0.25s cubic-bezier(0.3, 0.7, 0.4, 1),
      width 0.25s cubic-bezier(0.3, 0.7, 0.4, 1);
  }
  .tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 7px;
    height: 30px;
    padding: 0 14px;
    border-radius: 7px;
    color: var(--muted);
    font-weight: 500;
    white-space: nowrap;
    transition: color 0.15s;
  }
  .tab:hover,
  .tab[aria-selected='true'] {
    color: var(--fg);
  }
  .emoji {
    font-size: 14px;
    line-height: 1;
  }
</style>
