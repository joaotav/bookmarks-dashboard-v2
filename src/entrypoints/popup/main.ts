import { mount } from 'svelte';
import { getCachedSettings } from '@/lib/settings';
import App from './App.svelte';
// The same theme colors and base styles as the new tab page.
import '../newtab/app.css';

// The new tab page keeps a copy of the settings that the popup can read right away, so it
// opens in the right theme. The popup checks the saved settings too, once they load.
Object.assign(document.documentElement.dataset, getCachedSettings());

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
