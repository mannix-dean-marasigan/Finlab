// Phone-size audit of the signed-in pages on the live site. You log in once in the Chrome window that opens;
// then every page is visited at 390×844 (headless), checked for sideways scrolling and errors, and screenshotted.
//
//   node scripts/phone-audit.mjs            (screenshots in recordings/phone-audit)
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = process.env.SITE ?? 'https://mannix-dean-marasigan.github.io/Finlab';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'recordings', 'phone-audit');
mkdirSync(OUT, { recursive: true });
const PAGES = [
  '/dashboard', '/certifications', '/certifications/quickstart-value-a-stock', '/learn', '/learn/accounting-equation-journal', '/flashcards',
  '/challenges', '/trading', '/trading?tab=live', '/pitches', '/research', '/valuation', '/models', '/leaderboard', '/classes',
  '/passport', '/career', '/profile', '/whats-new', '/admin', '/admin/report', '/admin/beta',
];
const SESSION = join(process.env.TEMP ?? OUT, 'finlab-demo-session.json');

let storage = null;
if (existsSync(SESSION) && Date.now() - statSync(SESSION).mtimeMs < 50 * 60_000) storage = JSON.parse(readFileSync(SESSION, 'utf8'));
if (!storage) {
  const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--start-maximized'] });
  const ctx = await b.newContext({ viewport: null });
  const pg = await ctx.newPage();
  await pg.goto(SITE + '/login');
  console.log('Log in in the Chrome window that just opened, and leave it open. It closes by itself once your dashboard loads.');
  const deadline = Date.now() + 15 * 60_000;
  while (!ctx.pages().some((p) => /\/Finlab\/(dashboard|onboarding)/.test(p.url()))) {
    if (!b.isConnected()) {
      console.log('The login window was closed before the dashboard loaded, so nothing was checked.');
      process.exit(1);
    }
    if (Date.now() > deadline) {
      console.log('No login within 15 minutes, so nothing was checked.');
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  await new Promise((r) => setTimeout(r, 2500));
  storage = await ctx.storageState();
  await b.close();
  writeFileSync(SESSION, JSON.stringify(storage));
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, storageState: storage });
await ctx.addInitScript(() => {
  // Skip the tutorial overlay during the audit.
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
const report = [];
for (const path of PAGES) {
  const errors = [];
  const onErr = (e) => errors.push(e.message ?? String(e));
  const onCon = (m) => m.type() === 'error' && !/404|Failed to load resource/.test(m.text()) && errors.push(m.text());
  page.on('pageerror', onErr);
  page.on('console', onCon);
  await page.goto(SITE + path, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1800);
  const overflow = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - window.innerWidth;
    if (over <= 1) return null;
    // The widest elements that stick out, to know what to fix.
    const culprits = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed')
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')}`)
      .slice(0, 4);
    return { over, culprits };
  });
  const file = `${path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}.png`;
  await page.screenshot({ path: join(OUT, file), fullPage: true });
  report.push({ path, overflow, errors: errors.slice(0, 3), file });
  console.log(`${overflow || errors.length ? '✗' : '✓'} ${path}${overflow ? `  scrolls sideways by ${overflow.over}px (${overflow.culprits.join(', ')})` : ''}${errors.length ? `  errors: ${errors.slice(0, 2).join(' | ')}` : ''}`);
  page.off('pageerror', onErr);
  page.off('console', onCon);
}
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log(`\nScreenshots in ${OUT}`);
