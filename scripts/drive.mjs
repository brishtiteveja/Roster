// Serve the exported web build and drive the real UI in Chromium.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const ROOT = path.resolve('dist');
const OUT = path.resolve('scripts/shots');
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ico': 'image/x-icon', '.png': 'image/png', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, 'index.html'); // SPA fallback
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

await new Promise((r) => server.listen(4599, r));
console.log('serving dist on :4599');

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

async function shot(name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, name + '.png') });
  console.log('  shot:', name);
}
async function tap(text, opts = {}) {
  const el = page.getByText(text, { exact: false }).first();
  await el.waitFor({ state: 'visible', timeout: 8000 });
  await el.click();
  await page.waitForTimeout(400);
}

try {
  await page.goto('http://localhost:4599/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot('01-onboarding');

  // Approve two evidence items, delete one, then enter the season.
  const approves = page.getByText('Approve', { exact: true });
  await approves.nth(0).click(); await page.waitForTimeout(200);
  await approves.nth(0).click(); await page.waitForTimeout(200); // list shifts as one becomes "Approved"
  await shot('02-persona-approved');
  await tap('This is my profile');
  await shot('03-declare');

  await tap("I'm In");
  await page.waitForTimeout(600);
  await shot('04-board');

  // Seal three picks by tapping the heart on the swipe deck (each advances it).
  for (let i = 0; i < 3; i++) {
    const heart = page.getByText('♥', { exact: true }).first();
    await heart.click();
    await page.waitForTimeout(500);
  }
  await shot('04b-board-sealed');

  // Seal + clear (match the action button text, not the "SEALED PICKS" heading)
  const sealBtn = page.getByText(/Seal \d+ pick|Seal an empty/).first();
  await sealBtn.click();
  await page.waitForTimeout(1100);
  await shot('05-results');

  // Play a few more weeks so the observatory has real data.
  async function sealSome() {
    for (let i = 0; i < 2; i++) {
      const heart = page.getByText('♥', { exact: true }).first();
      if (await heart.count()) { await heart.click(); await page.waitForTimeout(400); }
    }
    const seal = page.getByText(/Seal \d+ pick|Seal an empty/).first();
    await seal.click();
    await page.waitForTimeout(900);
  }
  for (let w = 0; w < 3; w++) {
    const adv = page.getByText(/Advance to next week/).first();
    if (!(await adv.count())) break;
    await adv.click();
    await page.waitForTimeout(700);
    // Now on DECLARE
    const inBtn = page.getByText("I'm In", { exact: false }).first();
    if (await inBtn.count()) { await inBtn.click(); await page.waitForTimeout(600); await sealSome(); }
  }
  await shot('05b-results-later');

  // Observatory tab
  await tap('Observatory');
  await shot('06-observatory');

  // Connections tab
  await tap('Connections');
  await shot('07-connections');

  console.log('\nconsole errors:', errors.length);
  errors.slice(0, 12).forEach((e) => console.log('  !', e));
} catch (e) {
  console.log('DRIVER ERROR:', e.message);
  await shot('99-error');
} finally {
  await browser.close();
  server.close();
}
