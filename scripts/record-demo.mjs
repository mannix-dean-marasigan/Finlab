// Records the screen clips for the beta intro video, one file per scene, into recordings/.
// Opens your own Chrome; YOU log in, then it clicks through the site by itself. View-only: it submits nothing.
//
//   node scripts/record-demo.mjs            (all scenes)
//   node scripts/record-demo.mjs 5 7        (only scenes 5 and 7)
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://mannix-dean-marasigan.github.io/Finlab';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'recordings');
const VIEW = { width: 1280, height: 720 };
const VIDEO = VIEW; // headless Chrome records at the page's own size
const only = process.argv.slice(2).map(Number);
mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Playwright videos have no mouse pointer, so draw one that follows the mouse.
const CURSOR = () => {
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
      'background:rgba(255,200,80,.35);border:2px solid rgba(255,200,80,.95);z-index:2147483647;pointer-events:none;';
    document.body.appendChild(c);
    addEventListener('mousemove', (e) => (c.style.left = e.clientX + 'px', c.style.top = e.clientY + 'px'), true);
  });
};

let mouse = { x: VIEW.width / 2, y: VIEW.height / 2 };
async function moveTo(page, x, y, ms = 700) {
  const steps = Math.max(8, Math.round(ms / 16));
  await page.mouse.move(x, y, { steps });
  mouse = { x, y };
}
async function glideTo(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();
  if (!box) return false;
  await moveTo(page, box.x + Math.min(box.width / 2, 120), box.y + box.height / 2);
  await wait(250);
  return true;
}
async function click(page, locator) {
  if (await glideTo(page, locator)) {
    await locator.click();
    await wait(900);
  }
}
// Scroll the page itself (mouse-wheel scrolling gets swallowed by embedded YouTube videos).
async function scroll(page, px, ms = 2500) {
  const steps = Math.round(ms / 40);
  for (let i = 0; i < steps; i++) {
    await page.evaluate((dy) => {
      const all = [document.scrollingElement, ...document.querySelectorAll('main, div')];
      const el = all.find((e) => e && e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== 'hidden' && (e === document.scrollingElement || /(auto|scroll)/.test(getComputedStyle(e).overflowY)));
      (el ?? document.scrollingElement).scrollBy(0, dy);
    }, px / steps);
    await wait(40);
  }
}
async function scrollToText(page, re, ms = 2500) {
  const target = page.getByText(re).first();
  if (!(await target.count())) return false;
  const box = await target.boundingBox();
  if (box) await scroll(page, box.y - 110, ms);
  return true;
}
/** Wait until the data has arrived: no spinner left and a table on screen. */
async function loaded(page) {
  await wait(600);
  await page.waitForFunction(() => !/Loading/.test(document.body.innerText) && document.querySelector('table'), null, { timeout: 20000 }).catch(() => {});
  // Headless Chrome can stop sending video frames once a spinner disappears; a tiny scroll forces a fresh one.
  const rows = page.locator('tbody tr');
  for (let i = 0; i < Math.min(await rows.count(), 3); i++) {
    const box = await rows.nth(i).boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await wait(250);
  }
}
async function open(page, path) {
  await page.goto(SITE + path, { waitUntil: 'networkidle' }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {}); // close the welcome tour if it shows
  await moveTo(page, mouse.x, mouse.y, 50);
  await page.waitForFunction(() => !/Loading/.test(document.body.innerText), null, { timeout: 8000 }).catch(() => {});
  await wait(1000);
}

const SCENES = [
  ['01-certifications', async (p) => {
    await open(p, '/certifications');
    await wait(800);
    await scroll(p, 900, 4000);
    await wait(800);
  }],
  ['02-lesson', async (p) => {
    await open(p, '/learn/accounting-equation-journal');
    await wait(1500);
    await scrollToText(p, /Step 2 · Read the briefing/i, 3000);
    await wait(1200);
    await scroll(p, 500, 3000);
    await wait(800);
  }],
  ['03-practice-and-check', async (p) => {
    await open(p, '/learn/accounting-equation-journal');
    await scrollToText(p, /Practice · \d+ activities/, 1500);
    await wait(1500);
    await scroll(p, 350, 2000);
    await wait(800);
    await scrollToText(p, /Knowledge check · \d+ questions/, 2500);
    await wait(1200);
    await scroll(p, 300, 2000);
    await wait(1200);
  }],
  ['04-case', async (p) => {
    await open(p, '/challenges');
    await click(p, p.getByText('Journal Entries: Cebu Print Studio').first());
    await wait(1200);
    await scroll(p, 1200, 4000);
    await wait(800);
  }],
  ['05-leaderboards', async (p) => {
    await open(p, '/leaderboard');
    await wait(1200);
    await click(p, p.getByRole('tab', { name: 'Philippines' }).or(p.getByRole('button', { name: 'Philippines' })).first());
    await loaded(p);
    await wait(1500);
    await click(p, p.getByRole('tab', { name: 'This week (XP)' }).or(p.getByRole('button', { name: 'This week (XP)' })).first());
    await loaded(p);
    await wait(2500);
  }],
  ['06-classes', async (p) => {
    await open(p, '/classes');
    await wait(1500);
    await scroll(p, 500, 2500);
    await wait(1000);
  }],
  ['07-certificate', async (p) => {
    await open(p, '/passport');
    const cert = p.locator('a[href*="/verify/"]').first();
    if (await cert.count()) {
      await click(p, cert);
      await wait(1500);
      await scroll(p, 500, 2500);
      const li = p.getByText(/linkedin/i).first();
      if (await li.count()) await glideTo(p, li);
      await wait(1500);
    } else {
      console.log('   (no certificate found on your passport — scene 7 shows the passport instead)');
      await scroll(p, 600, 3000);
    }
  }],
  ['08-beta-checklist', async (p) => {
    await open(p, '/dashboard');
    const card = p.getByText('Beta tester checklist').first();
    if (await card.count()) await glideTo(p, card);
    await wait(800);
    await scroll(p, 250, 1500);
    await wait(2000);
  }],
];

// Your login is kept in a local file (outside the project) so re-takes don't need a new login.
const SESSION = join(process.env.TEMP ?? OUT, 'finlab-demo-session.json');
let storage = null;
if (existsSync(SESSION) && Date.now() - statSync(SESSION).mtimeMs < 50 * 60_000) {
  storage = JSON.parse(readFileSync(SESSION, 'utf8'));
  console.log('Using your recent login (no need to log in again).');
}
if (!storage) storage = await logIn();
writeFileSync(SESSION, JSON.stringify(storage));

async function logIn() {
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ["--start-maximized"] });
const context = await browser.newContext({ viewport: null });

// 1. You log in (not recorded).
const login = await context.newPage();
await login.goto(SITE + '/login');
await login.bringToFront();
console.log('\nLog in in the Chrome window that just opened. Recording starts automatically once your dashboard loads (waiting up to 15 minutes)…');
// Watch every tab, so closing one or logging in from a new tab still works.
const deadline = Date.now() + 15 * 60_000;
for (;;) {
  if (!browser.isConnected()) {
    console.log('The Chrome window was closed, so nothing was recorded. Run the recorder again when you are ready.');
    process.exit(1);
  }
  const pages = context.pages();
  if (pages.some((pg) => /\/Finlab\/(dashboard|onboarding)/.test(pg.url()))) break;
  if (!pages.length) await context.newPage().then((pg) => pg.goto(SITE + '/login')).catch(() => {});
  if (Date.now() > deadline) {
    console.log('Timed out waiting for the login.');
    process.exit(1);
  }
  await wait(1000);
}
console.log('Logged in. Recording now; please do not touch the mouse or keyboard.');
await wait(3000);
const state = await context.storageState();
await browser.close();
return state;
}

// Record in an invisible browser so the clips never depend on your screen size.
const browser = await chromium.launch({ channel: 'chrome', headless: true });

// 2. Each scene gets its own recording context that shares your login.
for (const [i, [name, run]] of SCENES.entries()) {
  if (only.length && !only.includes(i + 1)) continue;
  console.log(`Recording ${name}…`);
  const ctx = await browser.newContext({ viewport: VIEW, storageState: storage, recordVideo: { dir: OUT, size: VIDEO } });
  if (process.env.WITH_CURSOR) await ctx.addInitScript(CURSOR); // off by default: the drawn pointer freezes headless recordings
  const page = await ctx.newPage();
  if (process.env.DEBUG_REC) {
    const t0 = Date.now();
    const at = () => ((Date.now() - t0) / 1000).toFixed(1);
    page.on('request', (r) => r.url().includes('/rpc/') && console.log(at(), 'REQ', r.url().split('/rpc/')[1]));
    page.on('response', (r) => r.url().includes('/rpc/') && console.log(at(), 'RES', r.status(), r.url().split('/rpc/')[1]));
    page.on('pageerror', (e) => console.log(at(), 'PAGE ERROR', e.message.slice(0, 200)));
    page.on('console', (m) => m.type() === 'error' && console.log(at(), 'console', m.text().slice(0, 160)));
  }
  try {
    await run(page);
  } catch (e) {
    console.log(`   ${name} had a problem: ${e.message.split('\n')[0]}`);
  }
  await wait(3500); // the video lags behind the page, so hold the last screen before closing
  if (process.env.DEBUG_REC) console.log('   end of scene shows:', (await page.locator('body').innerText()).slice(-120).replace(/\s+/g, ' '));
  await page.close();
  await page.video().saveAs(join(OUT, `${name}.webm`));
  await page.video().delete();
  await ctx.close();
}
await browser.close();
console.log(`\nDone. Clips are in ${OUT}`);
