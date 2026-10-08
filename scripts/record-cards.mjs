// Records the animated intro and outro cards (brand/video/cards.html) to recordings/00-intro.webm and 09-outro.webm.
//
//   node scripts/record-cards.mjs
import { chromium } from 'playwright-core';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'recordings');
const PAGE = pathToFileURL(join(root, 'brand', 'video', 'cards.html')).href;
const SIZE = { width: 1920, height: 1080 };
const CARDS = [
  ['00-intro', 'intro', 10_000],
  ['09-outro', 'outro', 9_000],
];
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [name, card, ms] of CARDS) {
  console.log(`Recording ${name}…`);
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: OUT, size: SIZE } });
  const page = await ctx.newPage();
  await page.goto(`${PAGE}?card=${card}`);
  await page.waitForFunction(() => document.body.dataset.started === '1', null, { timeout: 15000 });
  await page.waitForTimeout(ms + 1500); // + a short hold, trimmed in Clipchamp
  await page.close();
  await page.video().saveAs(join(OUT, `${name}.webm`));
  await page.video().delete();
  await ctx.close();
}
await browser.close();
console.log('Done.');
