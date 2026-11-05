<script lang="ts">
  import { untrack } from 'svelte';
  import { defaultTitle, joinEmoji, placesOf, toWebUrl, type Space } from '@/lib/tree';

  let {
    url: initialUrl,
    title: initialTitle,
    spaces,
    categoryId: initialCategoryId,
    onsave,
    oncancel,
  }: {
    url: string;
    title: string;
    spaces: Space[];
    /** The category selected at first. Without it, or if it no longer exists, the first one. */
    categoryId: string | undefined;
    onsave: (categoryId: string, url: string, title: string) => void;
    oncancel: () => void;
  } = $props();

  // Only spaces with categories can be picked from.
  const groups = $derived(spaces.filter((space) => space.categories.length > 0));

  let url = $state(untrack(() => initialUrl));
  let title = $state(untrack(() => initialTitle));
  let categoryId = $state(
    untrack(() => {
      const ids = groups.flatMap((space) => space.categories.map((category) => category.id));
      return initialCategoryId && ids.includes(initialCategoryId) ? initialCategoryId : ids[0]!;
    }),
  );
  let message = $state<string | null>(null);

  const webUrl = $derived(toWebUrl(url));
  // Saving again is allowed, since a page can belong in more than one category.
  const already = $derived(webUrl ? placesOf(spaces, webUrl) : []);

  const select = (input: HTMLInputElement) => input.select();

  function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!webUrl) {
      message = 'Enter a web address, like example.com';
      return;
    }
    onsave(categoryId, webUrl, title.trim() || defaultTitle(webUrl));
  }
</script>

<form {onsubmit} aria-label="Save to workspace">
  {#if already.length > 0}
    <p class="note">Already in {already.join(', ')}</p>
  {/if}
  <label>
    <span>Title</span>
    <input bind:value={title} placeholder={webUrl ? defaultTitle(webUrl) : ''} {@attach select} />
  </label>
  <label>
    <span>URL</span>
    <input bind:value={url} aria-invalid={message !== null} oninput={() => (message = null)} />
  </label>
  {#if message}<p class="message" role="alert">{message}</p>{/if}
  <label>
    <span>Category</span>
    <select bind:value={categoryId}>
      {#each groups as space (space.id)}
        <optgroup label={joinEmoji(space.emoji, space.name)}>
          {#each space.categories as category (category.id)}
            <option value={category.id}>{category.title}</option>
          {/each}
        </optgroup>
      {/each}
    </select>
  </label>
  <div class="buttons">
    <button type="button" onclick={oncancel}>Cancel</button>
    <button type="submit" class="primary">Save</button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .note {
    margin: 0;
    padding: 6px 10px;
    border-left: 3px solid var(--accent);
    border-radius: 4px;
    background: var(--row);
    font-size: 12px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  label span {
    color: var(--muted);
    font-size: 12px;
  }
  input,
  select {
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
  input:focus,
  select:focus {
    border-color: var(--accent);
  }
  .message {
    margin: -6px 0 0;
    color: var(--danger);
    font-size: 11px;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 4px;
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
</style>
