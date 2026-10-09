// Smoke test: serves the production build and checks every public page at laptop and phone width.
// Fails on page crashes, console errors, horizontal scrolling or missing key text.
//
//   npm run build && npm run test:smoke        (uses your installed Chrome)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4179;
const BASE = `http://localhost:${PORT}`;

const PAGES = [
  { path: '/', expect: 'before you get it' },
  { path: '/about', expect: 'Finance is learned by doing' },
  { path: '/faq', expect: 'Questions, answered' },
  { path: '/terms', expect: 'Terms' },
  { path: '/privacy', expect: 'Privacy' },
  { path: '/login', expect: 'Sign in' },
  { path: '/register', expect: 'invite' },
  { path: '/verify/FLB-0000-0000', expect: 'not' },
  { path: '/dashboard', expect: 'Sign in', note: 'signed-out visitors are sent to sign in' },
];
const SIZES = [
  { name: 'laptop', width: 1366, height: 800 },
  { name: 'phone', width: 375, height: 812 },
];
// Expected noise: the SPA fallback answers deep links with a 404 status before the app renders.
const IGNORE = [/Failed to load resource: the server responded with a status of 404/];

const server = spawn(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: 'pipe',
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview server did not start')), 20000);
  server.stdout.on('data', (d) => String(d).includes(String(PORT)) && (clearTimeout(t), resolve()));
});

let failed = 0;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const size of SIZES) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    const problems = [];
    page.on('pageerror', (e) => problems.push(`crash: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && !IGNORE.some((r) => r.test(m.text())) && problems.push(`console: ${m.text()}`));
    for (const pg of PAGES) {
      problems.length = 0;
      await page.goto(BASE + pg.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const text = await page.locator('body').innerText();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const issues = [...problems];
      if (!text.toLowerCase().includes(pg.expect.toLowerCase())) issues.push(`missing text "${pg.expect}"`);
      if (overflow > 1) issues.push(`scrolls sideways by ${overflow}px`);
      console.log(`${issues.length ? '✗' : '✓'} ${size.name.padEnd(6)} ${pg.path}${issues.length ? ` — ${issues.join('; ')}` : ''}`);
      if (issues.length) failed++;
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(failed ? `\n${failed} problem(s)` : '\nall public pages OK');
process.exit(failed ? 1 : 0);
