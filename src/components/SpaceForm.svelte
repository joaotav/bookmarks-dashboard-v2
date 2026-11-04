<script lang="ts">
  import { untrack } from 'svelte';
  import { splitEmoji } from '@/lib/tree';

  let {
    heading,
    emoji = null,
    name = '',
    onsave,
    oncancel,
  }: {
    heading: string;
    emoji?: string | null;
    name?: string;
    onsave: (emoji: string | null, name: string) => void;
    oncancel: () => void;
  } = $props();

  const EMOJI = [
    '💼', '🏠', '🔬', '🛠️', '📚', '🎓', '💡', '🎨', '🎵', '🎮',
    '📈', '💰', '🛒', '✈️', '🍳', '🏃', '❤️', '🌱', '📰', '🗂️',
    '📌', '⭐', '🔥', '🚀', '🧪', '💻', '📝', '📅', '🎬', '🌍',
  ];

  let chosen = $state(untrack(() => emoji));
  let text = $state(untrack(() => name));
  let custom = $state('');

  const focus = (input: HTMLInputElement) => input.focus();

  // Any emoji can be typed or pasted into the "Other" field. Only its first emoji is kept.
  function onCustomInput() {
    const typed = splitEmoji(custom.trim()).emoji;
    if (typed) chosen = typed;
    custom = '';
  }

  function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    // An emoji typed at the start of the name works too.
    const split = splitEmoji(text.trim());
    if (!split.name) return;
    onsave(split.emoji ?? chosen, split.name);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      oncancel();
    }
  }
</script>

<!-- The listener catches Escape from the fields inside, which are interactive. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form class="space-form" aria-label={heading} {onsubmit} {onkeydown}>
  <h2>{heading}</h2>
  <input class="name" bind:value={text} aria-label="Space name" placeholder="Name" {@attach focus} />
  <fieldset>
    <legend>Icon</legend>
    <div class="grid">
      <label class="none" title="No icon">
        <input type="radio" name="emoji" checked={chosen === null} onchange={() => (chosen = null)} />
        <span aria-hidden="true">∅</span><span class="visually-hidden">No icon</span>
      </label>
      {#each EMOJI as option (option)}
        <label>
          <input type="radio" name="emoji" checked={chosen === option} onchange={() => (chosen = option)} />
          {option}
        </label>
      {/each}
      {#if chosen !== null && !EMOJI.includes(chosen)}
        <label>
          <input type="radio" name="emoji" checked onchange={() => {}} />
          {chosen}
        </label>
      {/if}
    </div>
    <input class="custom" bind:value={custom} oninput={onCustomInput} aria-label="Other emoji" placeholder="Or type or paste any emoji" />
  </fieldset>
  <div class="buttons">
    <button type="button" onclick={oncancel}>Cancel</button>
    <button type="submit" class="primary" disabled={!splitEmoji(text.trim()).name}>Save</button>
  </div>
</form>

<style>
  .space-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 320px;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card);
    box-shadow: 0 12px 32px #0006;
  }
  h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
  .name,
  .custom {
    width: 100%;
    height: 30px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    outline: none;
    background: var(--bg);
    color: var(--fg);
    font: inherit;
  }
  .name:focus,
  .custom:focus {
    border-color: var(--accent);
  }
  fieldset {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
  .grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }
  /* Each option is a square. The radio button is invisible and covers it, so it gets the clicks and the focus. */
  .grid label {
    position: relative;
    display: grid;
    place-items: center;
    height: 32px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 17px;
    cursor: pointer;
  }
  .grid label:hover {
    background: var(--row);
  }
  .grid label:has(:checked) {
    border-color: var(--accent);
    background: var(--row);
  }
  .grid label:has(:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .grid input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .none {
    color: var(--muted);
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }
  .buttons button {
    height: 30px;
    padding: 0 14px;
    border-radius: 6px;
    color: var(--muted);
  }
  .buttons button:hover {
    background: var(--row-hover);
    color: var(--fg);
  }
  .buttons .primary {
    background: var(--accent);
    color: var(--bg);
    font-weight: 600;
  }
  .buttons .primary:hover {
    background: var(--accent);
    color: var(--bg);
    filter: brightness(1.1);
  }
  .buttons .primary:disabled {
    opacity: 0.5;
    cursor: default;
    filter: none;
  }
</style>
