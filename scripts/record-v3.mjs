// Records the screen clips for the v3 landscape beta video into recordings/v3/.
// Opens your Chrome for a one-time login (you type your own password), then records headless at 1280×720.
// It creates a practice round and one practice trade on your account (practice money only).
//
//   node scripts/record-v3.mjs            (all scenes)
//   node scripts/record-v3.mjs trading    (scenes whose name contains "trading")
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://mannix-dean-marasigan.github.io/Finlab';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'recordings', 'v3');
const VIEW = { width: 1280, height: 720 };
const only = process.argv[2];
mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function scroll(page, px, ms = 2500) {
  const steps = Math.max(1, Math.round(ms / 40));
  for (let i = 0; i < steps; i++) {
    await page.evaluate((dy) => {
      const all = [document.scrollingElement, ...document.querySelectorAll('main, div')];
      const el = all.find((e) => e && e.scrollHeight > e.clientHeight + 20 && (e === document.scrollingElement || /(auto|scroll)/.test(getComputedStyle(e).overflowY)));
      (el ?? document.scrollingElement).scrollBy(0, dy);
    }, px / steps);
    await wait(40);
  }
}
async function scrollToText(page, re, ms = 1500) {
  const t = page.getByText(re).first();
  if (!(await t.count())) return;
  const box = await t.boundingBox();
  if (box) await scroll(page, box.y - 100, ms);
}
async function settle(page) {
  await page.waitForFunction(() => !/Loading/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
  // A tiny repaint keeps headless video frames flowing after spinners disappear.
  await page.mouse.move(640, 400, { steps: 4 });
  await page.mouse.move(660, 410, { steps: 4 });
}
async function open(page, path) {
  await page.goto(SITE + path, { waitUntil: 'networkidle' }).catch(() => {});
  await settle(page);
  await wait(900);
}

const SCENES = {
  dashboard: async (p) => {
    await open(p, '/dashboard');
    await wait(1800);
    await scroll(p, 260, 2600);
    await wait(1200);
  },
  certifications: async (p) => {
    await open(p, '/certifications');
    await wait(800);
    await scroll(p, 700, 4200);
    await wait(600);
  },
  practice: async (p) => {
    await open(p, '/learn/accounting-equation-journal');
    await scrollToText(p, /Practice · \d+ activities/, 300);
    await scroll(p, 40, 300);
    await wait(900);
    const KEY = { 'Cash': 'debit', 'Accounts payable': 'credit', 'Rent expense': 'debit', 'Service revenue': 'credit', 'Equipment': 'debit',
      "Owner's capital": 'credit', 'Supplies': 'debit', 'Bank loan': 'credit', 'Utilities expense': 'debit' };
    for (const [item, side] of Object.entries(KEY)) {
      const btn = p.getByRole('button', { name: item, exact: true }).first();
      if (!(await btn.count())) continue;
      await btn.click();
      await wait(160);
      await p.getByText(`Increases with a ${side}`, { exact: true }).first().click();
      await wait(260);
    }
    const check = p.getByRole('button', { name: 'Check', exact: true }).first();
    if (await check.count()) await check.click();
    await wait(2600);
  },
  case: async (p) => {
    await open(p, '/challenges');
    await p.getByText('Journal Entries: Cebu Print Studio').first().click().catch(() => {});
    await settle(p);
    await wait(1200);
    await scroll(p, 900, 3800);
    await wait(800);
  },
  'trading-play': async (p) => {
    await open(p, '/trading?tab=practice');
    await p.locator('canvas').first().waitFor({ timeout: 20000 }).catch(() => {});
    await wait(1500);
    await p.getByRole('button', { name: '4×' }).click().catch(() => {});
    await p.getByRole('button', { name: 'Play' }).click().catch(() => {});
    await wait(8000);
    await p.getByRole('button', { name: 'Pause' }).click().catch(() => {});
    await wait(1200);
  },
  'trading-order': async (p) => {
    await open(p, '/trading?tab=practice');
    await p.locator('canvas').first().waitFor({ timeout: 20000 }).catch(() => {});
    await wait(1500);
    if (await p.getByText(/Close position/).count()) {
      await p.getByRole('button', { name: /Close position/ }).click();
      await wait(1500);
    }
    await p.getByRole('button', { name: '50%', exact: true }).click().catch(() => {});
    await wait(700);
    await p.getByRole('button', { name: 'Buy', exact: true }).click().catch(() => {});
    await wait(1800);
    await p.getByRole('button', { name: '3% / 6%' }).click().catch(() => {});
    await wait(600);
    await p.getByRole('button', { name: 'Set exits' }).click().catch(() => {});
    await wait(2600);
  },
  leaderboard: async (p) => {
    await open(p, '/leaderboard?board=xp_week');
    await p.locator('table').first().waitFor({ timeout: 15000 }).catch(() => {});
    await settle(p);
    await wait(3200);
  },
  classes: async (p) => {
    await open(p, '/classes');
    await wait(1200);
    await scroll(p, 300, 2000);
    await wait(1400);
  },
  certificate: async (p) => {
    await open(p, '/certifications/accounting-fundamentals');
    await wait(800);
    const preview = p.getByRole('button', { name: /Preview as earned/ }).first();
    await preview.scrollIntoViewIfNeeded().catch(() => {});
    await wait(500);
    await preview.click().catch(() => {});
    await wait(3800);
    const celebrate = p.locator('[role="dialog"] button').filter({ hasNotText: /close|cancel/i }).last();
    if (await celebrate.count()) await celebrate.click().catch(() => {});
    await wait(4200);
  },
  beta: async (p) => {
    await open(p, '/dashboard');
    const card = p.getByText(/Beta tester checklist/i).first();
    if (await card.count()) {
      const box = await card.boundingBox();
      if (box) await scroll(p, box.y - 140, 1500);
    }
    await wait(3200);
  },
};

// ---------------------------------------------------------------- login (you type your password)
const SESSION = join(process.env.TEMP ?? OUT, 'finlab-demo-session.json');
let storage = null;
if (existsSync(SESSION) && Date.now() - statSync(SESSION).mtimeMs < 50 * 60_000) storage = JSON.parse(readFileSync(SESSION, 'utf8'));
if (!storage) {
  const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] });
  const ctx = await b.newContext({ viewport: null });
  const pg = await ctx.newPage();
  await pg.goto(SITE + '/login');
  await pg.bringToFront();
  console.log('Log in in the Chrome window that just opened, and leave it open. It closes by itself once your dashboard loads.');
  const deadline = Date.now() + 15 * 60_000;
  while (!ctx.pages().some((x) => /\/Finlab\/(dashboard|onboarding)/.test(x.url()))) {
    if (!b.isConnected()) { console.log('The login window was closed before the dashboard loaded.'); process.exit(1); }
    if (Date.now() > deadline) { console.log('No login within 15 minutes.'); process.exit(1); }
    await wait(1000);
  }
  await wait(2500);
  storage = await ctx.storageState();
  await b.close();
  writeFileSync(SESSION, JSON.stringify(storage));
}

// ---------------------------------------------------------------- record
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [name, run] of Object.entries(SCENES)) {
  if (only && !name.includes(only)) continue;
  console.log(`Recording ${name}…`);
  const ctx = await browser.newContext({ viewport: VIEW, storageState: storage, recordVideo: { dir: OUT, size: VIEW } });
  await ctx.addInitScript(() => {
    localStorage.setItem('finlab:indicators', '["sma20","rsi","sr"]');
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-')) {
        try {
          const uid = JSON.parse(localStorage.getItem(k) ?? '{}')?.user?.id;
          if (uid) localStorage.setItem(`finlab:tutorial:${uid}`, JSON.stringify({ phase: 'done', step: 0, mission: {} }));
        } catch { /* ignore */ }
      }
    }
  });
  const page = await ctx.newPage();
  try {
    await run(page);
  } catch (e) {
    console.log(`   ${name}: ${String(e.message).split(String.fromCharCode(10))[0]}`);
  }
  await wait(3500); // the video lags the page slightly; hold the last screen
  await page.close();
  await page.video().saveAs(join(OUT, `${name}.webm`));
  await page.video().delete();
  await ctx.close();
}
await browser.close();
console.log('Done.');
