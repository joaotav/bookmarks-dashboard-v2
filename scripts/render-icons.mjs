// Renders src/assets/icon.svg to the PNG sizes in public/icon/, which WXT puts in the manifest.
// Run with `node scripts/render-icons.mjs` after changing the SVG.
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const svg = await readFile(new URL('../src/assets/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
for (const size of [16, 32, 48, 96, 128]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: `public/icon/${size}.png`, omitBackground: true });
  await page.close();
}
await browser.close();
