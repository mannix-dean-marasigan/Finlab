// Accessibility check of the public pages with axe-core (the standard open-source checker).
//
//   npm run build && node scripts/a11y.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4180;
const axe = readFileSync(join(root, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const PAGES = ['/', '/about', '/faq', '/login', '/register', '/terms'];

const server = spawn(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((resolve) => server.stdout.on('data', (d) => String(d).includes(String(PORT)) && resolve()));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let total = 0;
try {
  for (const path of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
    await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' });
    await page.addScriptTag({ content: axe });
    const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations
      .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })));
    total += res.length;
    console.log(`${path}: ${res.length ? res.length + ' issue type(s)' : 'OK'}`);
    for (const v of res) console.log(`   [${v.impact}] ${v.id} (${v.nodes}x): ${v.help}\n      e.g. ${v.sample.join(' | ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
process.exit(total ? 1 : 0);
