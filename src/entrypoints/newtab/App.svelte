<script lang="ts">
  import { onMount } from 'svelte';
  import CategoryCard from '@/components/CategoryCard.svelte';
  import SettingsPanel from '@/components/SettingsPanel.svelte';
  import SpaceTabs from '@/components/SpaceTabs.svelte';
  import { getWorkspace, subscribe } from '@/lib/bookmarks';
  import { getActiveSpaceId, getCollapsed, setActiveSpaceId, setCollapsed, watchCollapsed } from '@/lib/meta';
  import { cacheSettings, getCachedSettings, getSettings, setSettings, watchSettings, type Settings } from '@/lib/settings';
  import { toSpaces, UNSORTED, type Space } from '@/lib/tree';

  let spaces = $state<Space[] | null>(null);
  let activeId = $state<string | undefined>();
  let error = $state<string | null>(null);
  let collapsed = $state<string[]>([]);
  let settings = $state<Settings>(getCachedSettings());

  // The stylesheets pick the theme, density, titles and sizing from data-* attributes on <html>.
  // The first run happens before the page is drawn, so it starts with the cached settings.
  $effect(() => {
    Object.assign(document.documentElement.dataset, settings);
    cacheSettings(settings);
  });

  // The remembered space, or the first one if it no longer exists.
  const active = $derived(spaces?.find((space) => space.id === activeId) ?? spaces?.[0]);

  // The cards shown in the active space. The "Unsorted" card uses the space's own ID.
  const cardIds = $derived(
    active ? [...(active.unsorted.length > 0 ? [active.id] : []), ...active.categories.map((category) => category.id)] : [],
  );

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

  function saveCollapsed(ids: string[]) {
    collapsed = ids;
    void setCollapsed(ids);
  }

  function toggle(id: string) {
    saveCollapsed(collapsed.includes(id) ? collapsed.filter((other) => other !== id) : [...collapsed, id]);
  }

  function saveSettings(next: Settings) {
    settings = next;
    void setSettings(next);
  }

  // Both only touch the active space, so other spaces keep their own state.
  const collapseAll = () => saveCollapsed([...new Set([...collapsed, ...cardIds])]);
  const expandAll = () => saveCollapsed(collapsed.filter((id) => !cardIds.includes(id)));

  onMount(() => {
    const unsubscribe = subscribe(load);
    const stopWatchingCollapsed = watchCollapsed((ids) => (collapsed = ids));
    const stopWatchingSettings = watchSettings((next) => (settings = next));
    void (async () => {
      [activeId, collapsed, settings] = await Promise.all([getActiveSpaceId(), getCollapsed(), getSettings()]);
      await load();
    })();
    return () => {
      unsubscribe();
      stopWatchingCollapsed();
      stopWatchingSettings();
    };
  });
</script>

<header class="bar">
  {#if spaces && spaces.length > 0}
    <SpaceTabs {spaces} activeId={active?.id} onselect={select} />
  {/if}
  <div class="end">
    {#if cardIds.length > 0}
      <div class="actions">
        <button onclick={collapseAll}>Collapse all</button>
        <button onclick={expandAll}>Expand all</button>
      </div>
    {/if}
    <SettingsPanel {settings} onchange={saveSettings} />
  </div>
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
          <CategoryCard
            id={active.id}
            title={UNSORTED}
            links={active.unsorted}
            collapsed={collapsed.includes(active.id)}
            ontoggle={() => toggle(active.id)}
          />
        {/if}
        {#each active.categories as category (category.id)}
          <CategoryCard
            id={category.id}
            title={category.title}
            links={category.links}
            collapsed={collapsed.includes(category.id)}
            ontoggle={() => toggle(category.id)}
          />
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
  .end {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .actions {
    display: flex;
    gap: 4px;
  }
  .actions button {
    height: 30px;
    padding: 0 10px;
    border-radius: 8px;
    color: var(--muted);
    font-size: 12px;
  }
  .actions button:hover {
    background: var(--row-hover);
    color: var(--fg);
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
  /* Fixed sizing: columns of one card width, stretched to fill the row. */
  :global(:root[data-sizing='fixed']) .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--card-width), 1fr));
    align-items: start;
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
