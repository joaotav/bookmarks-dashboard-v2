<script lang="ts">
  import { onMount } from 'svelte';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Space } from '@/lib/tree';

  let {
    spaces,
    activeId,
    unsortedId,
    onselect,
    onmove,
  }: {
    spaces: Space[];
    activeId: string | undefined;
    /** The "Unsorted" tab isn't a folder of its own, so it stays last and can't be moved. */
    unsortedId: string | undefined;
    onselect: (id: string) => void;
    /** A space dropped before `before`, or at the end without it. */
    onmove: (id: string, before: string | undefined) => void;
  } = $props();

  // Follows the dragged tab around, until the move is saved and the spaces come back from
  // the browser.
  let movable = $derived(spaces.filter((space) => space.id !== unsortedId));
  const unsorted = $derived(spaces.find((space) => space.id === unsortedId));
  const FLIP_MS = 150;

  function drop({ detail }: CustomEvent<DndEvent<Space>>) {
    movable = detail.items;
    const ids = movable.map((space) => space.id);
    const before = spaces.filter((space) => space.id !== unsortedId).map((space) => space.id);
    if (ids.join() !== before.join()) onmove(detail.info.id, ids[ids.indexOf(detail.info.id) + 1]);
  }

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

  // Runs after the DOM updates whenever the active tab or the list of tabs changes, including
  // while a tab is dragged, so the pill follows the gap it leaves.
  $effect(() => {
    void activeId;
    void spaces;
    void movable;
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
  <!-- The library's automatic roles would replace the tab roles, so they're off. -->
  <div
    class="tabs"
    use:dndzone={{
      items: movable,
      type: 'space',
      flipDurationMs: FLIP_MS,
      zoneTabIndex: -1,
      dropTargetStyle: {},
      autoAriaDisabled: true,
      useCursorForDetection: true,
    }}
    onconsider={({ detail }) => (movable = detail.items)}
    onfinalize={drop}
  >
    {#each movable as space (space.id)}
      <button
        class="tab"
        role="tab"
        aria-selected={space.id === activeId}
        onclick={() => onselect(space.id)}
        animate:flip={{ duration: FLIP_MS }}
      >
        {@render label(space)}
      </button>
    {/each}
  </div>
  {#if unsorted}
    <button class="tab" role="tab" aria-selected={unsorted.id === activeId} onclick={() => onselect(unsorted.id)}>
      {@render label(unsorted)}
    </button>
  {/if}
</div>

{#snippet label(space: Space)}
  {#if space.emoji}<span class="emoji">{space.emoji}</span>{/if}
  <span>{space.name}</span>
{/snippet}

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
  .tabs {
    display: flex;
    gap: 2px;
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
  /* The copy that follows the pointer is outside the track, away from the pill. */
  .tab:global(#dnd-action-dragged-el) {
    background: var(--row-hover);
    color: var(--fg);
  }
  .emoji {
    font-size: 14px;
    line-height: 1;
  }
</style>
