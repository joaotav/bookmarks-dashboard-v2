<script lang="ts">
  import { OPTIONS, type Settings } from '@/lib/settings';

  let { settings, onchange }: { settings: Settings; onchange: (settings: Settings) => void } = $props();

  const GROUPS: { key: keyof Settings; label: string }[] = [
    { key: 'layout', label: 'Layout' },
    { key: 'theme', label: 'Theme' },
    { key: 'density', label: 'Density' },
    { key: 'titles', label: 'Titles' },
    { key: 'sizing', label: 'Card sizing' },
  ];

  let open = $state(false);
  let root: HTMLElement;
  let toggleButton: HTMLButtonElement;

  function choose(key: keyof Settings, value: string) {
    onchange({ ...settings, [key]: value });
  }

  function close() {
    open = false;
    toggleButton.focus();
  }

  // A click anywhere outside the panel closes it.
  function onWindowClick(event: MouseEvent) {
    if (open && !root.contains(event.target as Node)) open = false;
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') close();
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div class="settings" bind:this={root}>
  <button
    class="toggle"
    aria-label="Settings"
    aria-expanded={open}
    aria-controls="settings-panel"
    bind:this={toggleButton}
    onclick={() => (open = !open)}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  </button>
  {#if open}
    <div id="settings-panel" class="panel" role="dialog" aria-label="Display settings">
      {#each GROUPS as group (group.key)}
        <fieldset>
          <legend>{group.label}</legend>
          <div class="options">
            {#each Object.entries(OPTIONS[group.key]) as [value, label] (value)}
              <label>
                <input
                  type="radio"
                  name={group.key}
                  {value}
                  checked={settings[group.key] === value}
                  onchange={() => choose(group.key, value)}
                />
                {label}
              </label>
            {/each}
          </div>
        </fieldset>
      {/each}
    </div>
  {/if}
</div>

<style>
  .settings {
    position: relative;
  }
  .toggle {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    color: var(--muted);
  }
  .toggle:hover,
  .toggle[aria-expanded='true'] {
    background: var(--row-hover);
    color: var(--fg);
  }
  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }
  .panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 300px;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card);
    box-shadow: 0 12px 32px #0006;
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    margin-bottom: 6px;
    padding: 0;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  /* Each option is a pill. The radio button is invisible and covers the pill, so it gets the clicks and the focus. */
  label {
    position: relative;
    padding: 5px 10px;
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--muted);
    cursor: pointer;
  }
  label:hover {
    color: var(--fg);
  }
  label:has(:checked) {
    border-color: var(--accent);
    background: var(--row);
    color: var(--fg);
  }
  label:has(:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
</style>
