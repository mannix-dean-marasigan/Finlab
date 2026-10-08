// Records the animated intro/outro cards (brand/video/cards.html) in wide (1920×1080), square (1080×1080) and vertical (1080×1920),
// and saves cover images. Output: recordings/00-intro[-square].webm, 09-outro[-square].webm, cover[-square].png
//
//   node scripts/record-cards.mjs
import { chromium } from 'playwright-core';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'recordings');
const PAGE = pathToFileURL(join(root, 'brand', 'video', 'cards.html')).href;
const SHAPES = { '': { width: 1920, height: 1080 }, '-square': { width: 1080, height: 1080 }, '-vertical': { width: 1080, height: 1920 } };
const CARDS = [
  ['00-intro', 'intro', 7_000],
  ['09-outro', 'outro', 8_000],
];
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [suffix, size] of Object.entries(SHAPES)) {
  const shape = suffix ? suffix.slice(1) : 'wide';
  for (const [name, card, ms] of CARDS) {
    console.log(`Recording ${name}${suffix}…`);
    const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: OUT, size } });
    const page = await ctx.newPage();
    await page.goto(`${PAGE}?card=${card}&shape=${shape}`);
    await page.waitForFunction(() => document.body.dataset.started === '1', null, { timeout: 15000 });
    await page.waitForTimeout(ms + 1500); // + a short hold that the video builder trims
    await page.close();
    await page.video().saveAs(join(OUT, `${name}${suffix}.webm`));
    await page.video().delete();
    await ctx.close();
  }
  const page = await browser.newPage({ viewport: size });
  await page.goto(`${PAGE}?card=cover&shape=${shape}`);
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 15000 });
  await page.screenshot({ path: join(OUT, `cover${suffix}.png`) });
  await page.close();
  console.log(`Saved cover${suffix}.png`);
}
await browser.close();
console.log('Done.');
