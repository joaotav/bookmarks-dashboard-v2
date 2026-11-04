<script lang="ts" module>
  export interface MenuItem {
    label: string;
    onselect: () => void;
  }
</script>

<script lang="ts">
  let { label, items }: { label: string; items: MenuItem[] } = $props();

  let open = $state(false);
  let root: HTMLElement;
  let toggleButton: HTMLButtonElement;

  function select(item: MenuItem) {
    open = false;
    item.onselect();
  }

  // A click anywhere outside the menu closes it.
  function onWindowClick(event: MouseEvent) {
    if (open && !root.contains(event.target as Node)) open = false;
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      open = false;
      toggleButton.focus();
    }
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div class="menu" class:open bind:this={root}>
  <button class="toggle" aria-label={label} aria-expanded={open} bind:this={toggleButton} onclick={() => (open = !open)}>
    <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="8" r="1.3" /><circle cx="8" cy="8" r="1.3" /><circle cx="12.5" cy="8" r="1.3" /></svg>
  </button>
  {#if open}
    <div class="items">
      {#each items as item (item.label)}
        <button onclick={() => select(item)}>{item.label}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .menu {
    position: relative;
    flex: none;
  }
  .toggle {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    color: var(--muted);
  }
  .toggle:hover,
  .open .toggle {
    background: var(--row-hover);
    color: var(--fg);
  }
  svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }
  .items {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    min-width: 140px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--card);
    box-shadow: 0 8px 24px #0006;
  }
  .items button {
    padding: 6px 10px;
    border-radius: 5px;
    text-align: left;
    white-space: nowrap;
  }
  .items button:hover {
    background: var(--row-hover);
  }
</style>
