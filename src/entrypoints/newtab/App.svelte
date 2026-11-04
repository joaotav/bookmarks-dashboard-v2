<script lang="ts">
  import { onMount } from 'svelte';
  import CategoryCard from '@/components/CategoryCard.svelte';
  import SpaceTabs from '@/components/SpaceTabs.svelte';
  import { getWorkspace, subscribe } from '@/lib/bookmarks';
  import { getActiveSpaceId, setActiveSpaceId } from '@/lib/meta';
  import { toSpaces, UNSORTED, type Space } from '@/lib/tree';

  let spaces = $state<Space[] | null>(null);
  let activeId = $state<string | undefined>();
  let error = $state<string | null>(null);

  // The remembered space, or the first one if it no longer exists.
  const active = $derived(spaces?.find((space) => space.id === activeId) ?? spaces?.[0]);

  async function load() {
    try {
      spaces = toSpaces(await getWorkspace());
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  function select(id: string) {
    activeId = id;
    void setActiveSpaceId(id);
  }

  onMount(() => {
    const unsubscribe = subscribe(load);
    void (async () => {
      activeId = await getActiveSpaceId();
      await load();
    })();
    return unsubscribe;
  });
</script>

<header class="bar">
  {#if spaces && spaces.length > 0}
    <SpaceTabs {spaces} activeId={active?.id} onselect={select} />
  {/if}
</header>

<main>
  {#if error}
    <p class="notice">Couldn't load your bookmarks: {error}</p>
  {:else if spaces === null}
    <!-- Still loading. Rendering nothing avoids flashing the empty state. -->
  {:else if spaces.length === 0}
    <div class="notice">
      <p>Your workspace is empty.</p>
      <p>Add a folder inside <strong>Other Bookmarks › Workspace</strong> in your browser's bookmarks and it shows up here as a space.</p>
    </div>
  {:else if active}
    {#if active.unsorted.length === 0 && active.categories.length === 0}
      <p class="notice">This space has no categories yet. Add a folder inside it in your browser's bookmarks.</p>
    {:else}
      <div class="cards">
        {#if active.unsorted.length > 0}
          <CategoryCard title={UNSORTED} links={active.unsorted} />
        {/if}
        {#each active.categories as category (category.id)}
          <CategoryCard title={category.title} links={category.links} />
        {/each}
      </div>
    {/if}
  {/if}
</main>

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 52px;
    padding: 0 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bar);
  }
  main {
    padding: 20px;
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16px;
  }
  .notice {
    max-width: 520px;
    margin: 60px auto;
    color: var(--muted);
    text-align: center;
  }
  .notice strong {
    color: var(--fg);
  }
</style>
